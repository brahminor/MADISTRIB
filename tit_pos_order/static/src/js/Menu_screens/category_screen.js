odoo.define('tit_pos_order.category_screen', function(require) { 
   'use strict'; 
  	const PosComponent = require('point_of_sale.PosComponent'); 
   	const ProductScreen = require('point_of_sale.ProductScreen'); 
   	const {useListener} = require('web.custom_hooks'); 
   	const Registries = require('point_of_sale.Registries'); 
   	class category_screen extends PosComponent { 
    	
   	} 
   	category_screen.template = 'category_screen '; 
   	Registries.Component.add(category_screen); 
   	return category_screen; 
});