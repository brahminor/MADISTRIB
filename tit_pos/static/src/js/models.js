odoo.define('tit_pos.models', function (require) {
    "use strict";
    
    var models = require('point_of_sale.models');
    models.load_fields('res.partner',[ 'company_type', 'child_ids', 'type', 'siret', 'website']);

}); 