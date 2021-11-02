odoo.define('tit_pos_order.models', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    models.load_fields('res.partner',[]);
    models.load_fields('pos.commande',[]);
}); 
