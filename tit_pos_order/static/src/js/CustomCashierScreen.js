odoo.define('tit_pos_order.CustomCashierScreen', function (require) {
  "use strict";
  const update_css = () => {
    var contents = $('.pos-content');
    contents.find(".ctrl_btn").hide();
    contents.find(".set-customer").hide();
  };
  return { update_css }
});