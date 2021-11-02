odoo.define('tit_pos_order.CustomButtonTicketScreen', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const TicketScreen = require('point_of_sale.TicketScreen');
    var rpc = require('web.rpc');

    const CustomButtonTicketScreen = (TicketScreen) =>
    class extends TicketScreen {
        selectOrder(order) {
            
            this._setOrder(order);
            if (order === this.env.pos.get_order()) {
                this.showScreen('ProductScreen');
            }
        }
        _setOrder(order) {
            this.env.pos.set_order(order);
        }
    };
    Registries.Component.extend(TicketScreen, CustomButtonTicketScreen);
    return CustomButtonTicketScreen;
});