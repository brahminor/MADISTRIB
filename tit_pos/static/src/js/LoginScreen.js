odoo.define('tit_pos.LoginScreen', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const LoginScreen = require('pos_hr.LoginScreen');
    const Registries = require('point_of_sale.Registries');
    var { Gui } = require('point_of_sale.Gui');
    var models = require('point_of_sale.models');
    const { useState } = owl.hooks;
    const { update_css } = require('tit_pos_order.CustomCashierScreen')
    var rpc = require('web.rpc');
    const {verif_groupe} = require('tit_pos_order.verif_group_user')
    models.load_fields('res.partner',[ 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit']);
    const LoginScreenOverride = LoginScreen =>
        class extends LoginScreen {
            /**
            * @override
            */
            async selectCashier() {
	            const list = this.env.pos.employees.map((employee) => {
	                return {
	                    id: employee.id,
	                    item: employee,
	                    label: employee.name,
	                    isSelected: false,
	                };
	            });
	            const employee = await this.selectEmployee(list);
	            if (employee) {
	                this.env.pos.set_cashier(employee);
	                this.back();
	                var self_2 = this;
	                verif_groupe()//verifier groupe de l'utilisateur connecté sur le pos
	                var result = await rpc.query({
                        model: 'res.users',
                        method: 'verification_groupe_user_modified_in_pos',
                        args: [PosComponent.env.pos.get_cashier().user_id[0]],
                    }).then(function(r){
                        if ((r == 8) || (r == 9)) {
                        	self_2.showScreen('ProductScreen');
                    	}
                    	else{
                    		self_2.showScreen('profile_page');
                    	}
                    });
                    

	            }
	        }
        };
    Registries.Component.extend(LoginScreen, LoginScreenOverride);
    return LoginScreen;
});
