package engine

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

type DiscountType string

const (
	DiscountPercent DiscountType = "percentage"
	DiscountFixed   DiscountType = "fixed_amount"
	DiscountLoyalty DiscountType = "loyalty_points"
)

type PromoRule struct {
	Code             string       `json:"code"`
	Type             DiscountType `json:"type"`
	Value            float64      `json:"value"` // e.g. 20 for 20%, or 2000 for 2000 KZT
	MinOrderAmount   float64      `json:"min_order_amount"`
	MaxDiscountLimit float64      `json:"max_discount_limit"`
	ExpiresAt        time.Time    `json:"expires_at"` // Zero time = never expires
	IsActive         bool         `json:"is_active"`
}

type DiscountEngine struct {
	promos map[string]*PromoRule
}

func NewDiscountEngine() *DiscountEngine {
	return &DiscountEngine{
		promos: make(map[string]*PromoRule),
	}
}

func (de *DiscountEngine) RegisterPromo(rule *PromoRule) {
	de.promos[strings.ToUpper(rule.Code)] = rule
}

func (de *DiscountEngine) ApplyPromo(order *models.Order, code string) (float64, error) {
	rule, exists := de.promos[strings.ToUpper(code)]
	if !exists || !rule.IsActive {
		return 0, errors.New("жарамсыз немесе белсенді емес промокод")
	}

	if !rule.ExpiresAt.IsZero() && time.Now().After(rule.ExpiresAt) {
		return 0, errors.New("промокодтың қолданылу мерзімі өткен")
	}

	order.RecalculateTotal()
	if order.GrossAmount < rule.MinOrderAmount {
		return 0, errors.New("тапсырыс сомасы промокодтың ең төменгі шегіне жетпейді")
	}

	currentRemaining := order.TotalAmount
	if currentRemaining <= 0 {
		return 0, errors.New("тапсырыс сомасы 0-ге тең, жеңілдік қолданылмайды")
	}

	var discount float64
	switch rule.Type {
	case DiscountPercent:
		if rule.Value <= 0 {
			return 0, errors.New("жеңілдік пайызы 0-ден үлкен болуы керек")
		}
		discount = order.GrossAmount * (rule.Value / 100.0)
		if rule.MaxDiscountLimit > 0 && discount > rule.MaxDiscountLimit {
			discount = rule.MaxDiscountLimit
		}
		if discount > currentRemaining {
			discount = currentRemaining
		}
	case DiscountFixed:
		discount = rule.Value
		if discount > currentRemaining {
			discount = currentRemaining
		}
	case DiscountLoyalty:
		discount = rule.Value
		if discount > currentRemaining {
			discount = currentRemaining
		}
	}

	order.DiscountAmount += discount
	order.RecalculateTotal()
	return discount, nil
}

// ApplyCustomerTier applies automatic membership discount based on loyalty tier
func (de *DiscountEngine) ApplyCustomerTier(order *models.Order, tier string) (float64, error) {
	order.RecalculateTotal()
	if order.TotalAmount <= 0 {
		return 0, errors.New("тапсырыс сомасы 0-ге тең")
	}

	var percent float64
	switch strings.ToLower(tier) {
	case "platinum":
		percent = 15.0
	case "gold":
		percent = 10.0
	case "silver":
		percent = 5.0
	case "standard":
		return 0, nil
	default:
		return 0, fmt.Errorf("белгісіз клиент санаты: %s", tier)
	}

	discount := order.GrossAmount * (percent / 100.0)
	if discount > order.TotalAmount {
		discount = order.TotalAmount
	}

	order.DiscountAmount += discount
	order.RecalculateTotal()
	return discount, nil
}

// ApplyHappyHour applies time-window based discount (e.g. Lunch hour 12:00-15:00)
func (de *DiscountEngine) ApplyHappyHour(order *models.Order, startHour, endHour int, percent float64, checkTime time.Time) (float64, error) {
	order.RecalculateTotal()
	if order.TotalAmount <= 0 {
		return 0, errors.New("тапсырыс сомасы 0-ге тең")
	}

	hour := checkTime.Hour()
	if hour < startHour || hour >= endHour {
		return 0, nil // Outside happy hour window
	}

	if percent <= 0 || percent > 50 {
		return 0, errors.New("Happy Hour жеңілдігі 0-ден 50% аралығында болуы тиіс")
	}

	discount := order.GrossAmount * (percent / 100.0)
	if discount > order.TotalAmount {
		discount = order.TotalAmount
	}

	order.DiscountAmount += discount
	order.RecalculateTotal()
	return discount, nil
}
