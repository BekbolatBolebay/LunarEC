package engine

import (
	"errors"
	"strings"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

type DiscountType string

const (
	DiscountPercent  DiscountType = "percentage"
	DiscountFixed    DiscountType = "fixed_amount"
	DiscountLoyalty  DiscountType = "loyalty_points"
)

type PromoRule struct {
	Code             string       `json:"code"`
	Type             DiscountType `json:"type"`
	Value            float64      `json:"value"` // e.g. 20 for 20%, or 2000 for 2000 KZT
	MinOrderAmount   float64      `json:"min_order_amount"`
	MaxDiscountLimit float64      `json:"max_discount_limit"`
	ExpiresAt        time.Time    `json:"expires_at"`
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

	if time.Now().After(rule.ExpiresAt) {
		return 0, errors.New("промокодтың қолданылу мерзімі өткен")
	}

	order.RecalculateTotal()
	if order.TotalAmount < rule.MinOrderAmount {
		return 0, errors.New("тапсырыс сомасы промокодтың ең төменгі шегіне жетпейді")
	}

	var discount float64
	switch rule.Type {
	case DiscountPercent:
		discount = order.TotalAmount * (rule.Value / 100.0)
		if rule.MaxDiscountLimit > 0 && discount > rule.MaxDiscountLimit {
			discount = rule.MaxDiscountLimit
		}
	case DiscountFixed:
		discount = rule.Value
		if discount > order.TotalAmount {
			discount = order.TotalAmount
		}
	case DiscountLoyalty:
		discount = rule.Value
	}

	order.TotalAmount -= discount
	order.UpdatedAt = time.Now()
	return discount, nil
}
