"""
LunarEC Odoo ERP Sync Worker (Python 3)
Handles bidirectional synchronization via JSON-RPC 2.0
"""

import json
from typing import Dict, Any, List

class OdooPayloadBuilder:
    @staticmethod
    def build_sale_order_payload(order_ref: str, partner_id: int, order_lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Formats sale.order creation payload for Odoo ORM
        """
        lines = []
        for line in order_lines:
            lines.append((0, 0, {
                'product_id': line['odoo_product_id'],
                'product_uom_qty': line['qty'],
                'price_unit': line['unit_price'],
                'name': line.get('name', 'Dish item')
            }))

        return {
            'partner_id': partner_id,
            'client_order_ref': order_ref,
            'order_line': lines,
            'state': 'sale'  # Directly confirm sale
        }

    @staticmethod
    def parse_stock_quant_response(rpc_response: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extracts product sku to current stock quantity mapping from Odoo stock.quant
        """
        stock_map = {}
        for quant in rpc_response:
            prod_name = quant.get('product_id', [0, 'Unknown'])[1]
            qty = quant.get('quantity', 0.0)
            stock_map[prod_name] = qty
        return stock_map
