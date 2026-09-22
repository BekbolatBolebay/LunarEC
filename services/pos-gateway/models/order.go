package models

import (
	"time"
)

type OrderStatus string

const (
	StatusDraft         OrderStatus = "draft"
	StatusSentToKitchen OrderStatus = "sent_to_kitchen"
	StatusCooking       OrderStatus = "cooking"
	StatusReadyToServe  OrderStatus = "ready_to_serve"
	StatusServed        OrderStatus = "served"
	StatusPaid          OrderStatus = "paid"
	StatusCancelled     OrderStatus = "cancelled"
)

type KitchenStation string

const (
	StationGrill  KitchenStation = "grill"
	StationCold   KitchenStation = "cold_prep"
	StationBar    KitchenStation = "bar"
	StationBakery KitchenStation = "bakery"
)

type OrderItem struct {
	ID         string         `json:"id"`
	MenuItemID string         `json:"menu_item_id"`
	Name       string         `json:"name"`
	Quantity   int            `json:"quantity"`
	UnitPrice  float64        `json:"unit_price"`
	Station    KitchenStation `json:"station"`
	Comments   string         `json:"comments"`
	IsPrepared bool           `json:"is_prepared"`
}

type Order struct {
	ID             string      `json:"id"`
	TableNumber    int         `json:"table_number"`
	WaiterName     string      `json:"waiter_name"`
	GuestsCount    int         `json:"guests_count"`
	Status         OrderStatus `json:"status"`
	Items          []OrderItem `json:"items"`
	GrossAmount    float64     `json:"gross_amount"`
	DiscountAmount float64     `json:"discount_amount"`
	TotalAmount    float64     `json:"total_amount"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
}

func (o *Order) RecalculateTotal() {
	var sum float64
	for _, it := range o.Items {
		sum += float64(it.Quantity) * it.UnitPrice
	}
	o.GrossAmount = sum
	net := sum - o.DiscountAmount
	if net < 0 {
		net = 0
	}
	o.TotalAmount = net
	o.UpdatedAt = time.Now()
}
