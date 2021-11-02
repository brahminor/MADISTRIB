odoo.define('tit_pos_management.models', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var PosDB = require('point_of_sale.DB');

    models.load_models({
    model: 'pos.service',
    fields: [],
    loaded: function(self,services){
        self.services = services;
        },
    });

    PosDB.include({
          _partner_search_string: function(partner){
            /* Ajouter le service client dans le filtre
            */
            var res = this._super(partner).replace('\n', '');
            if(partner.service_id[1]){
                res += '|' + partner.service_id[1];
            }
              res += '\n'
              return res;
         },
    });
});



