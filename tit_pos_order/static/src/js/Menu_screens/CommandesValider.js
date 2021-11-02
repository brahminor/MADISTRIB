odoo.define('tit_pos_order.CommandesValider', function (require) {
    'use strict';
    const PosComponent = require('point_of_sale.PosComponent');

    const Registries = require('point_of_sale.Registries');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { useListener } = require('web.custom_hooks');
    const { posbus } = require('point_of_sale.utils');
    var rpc = require('web.rpc');
    var models = require('point_of_sale.models');
    var session = require('web.session');

    models.load_models({
        model: 'pos.order',
        fields: [],
        domain: function (self) { return [['state', 'in', ['paid', 'done']]]; },
        loaded: function (self, order) {
            self.order = order;
        },
    });

    class CommandesValider extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('filter-selected', this._onFilterSelected);
            useListener('search', this._onSearch);
            this.searchDetails = {};
            this.filter = null;
            this._initializeSearchFieldConstants();

        }
        back() {
            this.trigger('close-temp-screen');
        }
        get filteredOrderList() {
            const filterCheck = (order) => {
                if (this.filter) {
                    const screen = order.get_screen_data();
                    return this.filter === this.constants.screenToStatusMap[screen.name];
                }
                return true;
            };
            const { fieldValue, searchTerm } = this.searchDetails;
            const fieldAccessor = this._searchFields[fieldValue];
            const searchCheck = (order) => {
                if (!fieldAccessor) return true;
                const fieldValue = fieldAccessor(order);
                if (fieldValue === null) return true;
                if (!searchTerm) return true;
                return fieldValue && fieldValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
            };
            const predicate = (order) => {
                return filterCheck(order) && searchCheck(order);
            };
            
            return this.env.pos.order.filter(predicate);

        }
        getDate(commande) {
            return moment(commande.date_order).format('DD/MM/YYYY hh:mm A');
        }
        getClient(cmd) {
            return cmd.partner_id.length > 0 ? cmd.partner_id[1] : ''
        }
        getTotal(cmd) {
            return this.env.pos.format_currency(cmd.amount_total);
        }

        selectOrder(com) {
            let or = this.env.pos.get_order()
            
            this.load_commande(com);
        }

        async load_commande(order) {
            const newOrder = this.env.pos.add_new_order()
            newOrder.set_client(this.env.pos.db.get_partner_by_id(order.partner_id[0]));
            const order_lines = await this.get_order_lines(order.id)
            for (const orderLine of Object.values(order_lines)) {
                var product = this.env.pos.db.get_product_by_id(orderLine.product_id[0])
                var qty = parseFloat(orderLine.qty)
                var discount = parseInt(orderLine.discount)
                var price = parseFloat(orderLine.price_unit)
                newOrder.add_product(product, { quantity: qty, price: price, discount: discount })

            }

            this.env.pos.set_order(newOrder);
        }
        async get_order_lines(id) {
            let order_lines = {}
            await rpc.query({
                model: 'pos.order.line',
                method: 'search_read',
                args: [[['order_id', '=', id]]],
            })
                .then(function (lines) {
                    order_lines = { ...lines }
                });
            return order_lines;
        }

        get searchBarConfig() {
            return {
                searchFields: this.constants.searchFieldNames,
                filter: { show: false, options: {} },
            };
        }
        get _searchFields() {
            const { ReceiptNumber, Date, Customer } = this.getSearchFieldNames();
            var fields = {
                [ReceiptNumber]: (order) => order.pos_reference,
                [Date]: (order) => moment(order.date_order).format('DD/MM/YYYY hh:mm A'),
                [Customer]: (order) => order.partner_id[1],
            };
            return fields;
        }
        _initializeSearchFieldConstants() {
            this.constants = {};
            Object.assign(this.constants, {
                searchFieldNames: Object.keys(this._searchFields)
            });
        }
        _onFilterSelected(event) {
            this.filter = event.detail.filter;
            this.render();
        }
        _onSearch(event) {
            const searchDetails = event.detail;
            Object.assign(this.searchDetails, searchDetails);
            this.render();
        }
        getSearchFieldNames() {
            return {
                ReceiptNumber: this.env._t('Receipt Number'),
                Date: this.env._t('Date'),
                Customer: this.env._t('Customer'),
            };
        }

    }
    CommandesValider.template = 'CommandesValider';

    Registries.Component.add(CommandesValider);

    return CommandesValider;
});


