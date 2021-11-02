odoo.define('tit_pos.models', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    models.load_fields('account.journal',['deferred_check','check','check_kdo','avoir_journal']);
    models.load_models({
    model: 'pos.payment',
    fields: [],
    loaded: function(self,payments){
        self.payments = payments;
    },
 });

    models.load_fields('pos.payment.method',['type_cheque','cash_journal_bank_id']);

var SuperPaymentline = models.Paymentline;
models.Paymentline = models.Paymentline.extend({
    initialize: function(attributes, options) {
        this.check_number = '';
        // this.check_date = '';     
        SuperPaymentline.prototype.initialize.apply(this,arguments);
    },
    export_as_JSON: function(){
        var json = SuperPaymentline.prototype.export_as_JSON.apply(this,arguments);
        json.check_number = this.check_number;
        json.check_date = this.check_date;   
                       
        return json;
    },
    init_from_JSON: function(json){
        SuperPaymentline.prototype.init_from_JSON.apply(this,arguments);
        this.check_number = json.check_number;
        this.check_date = json.check_date;                      
    },
    set_check_number: function(check_number){
        this.order.assert_editable();
        this.check_number = check_number;
        
        this.trigger('change',this);

                
        },
    set_check_date: function(check_date){
        this.order.assert_editable();
        this.check_date = check_date;
        
        this.trigger('change',this);
        },



});

}); 
