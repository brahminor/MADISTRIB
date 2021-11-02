odoo.define('tit_pos_order.ClientListScreenScreen', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    var rpc = require('web.rpc');

    const {verif_groupe} = require('tit_pos_order.verif_group_user')
    const ReceiptScreenScreen = (ReceiptScreen) =>
	    class extends ReceiptScreen {
            constructor() {
                super(...arguments);
                var self = this;
                verif_groupe();
            }

	    	 orderDone() {
                this.currentOrder.finalize();
                this.env.pos.add_new_order();
	        }
	    };
    Registries.Component.extend(ReceiptScreen, ReceiptScreenScreen);
    return ReceiptScreenScreen;
});