
odoo.define('tit_pos_paiement.ChequeDifPopup', function(require) {
    'use strict';

    const { useState, useRef } = owl.hooks;
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');

    // formerly ChequeDifPopupWidget
    // IMPROVEMENT: This code is very similar to TextInputPopup.
    //      Combining them would reduce the code.
    class ChequeDifPopup extends AbstractAwaitablePopup {
        /**
         * @param {Object} props
         * @param {string} props.startingValue
         */
        constructor() {
            super(...arguments);
            this.state = useState({ inputValue_1: this.props.startingValue });
            this.state = useState({ inputValue_2: this.props.startingValue });
            this.inputRef = useRef('input');
        }
        mounted() {
            this.inputRef.el.focus();
        }
        getPayload() {
        //charge les données du state lorsque le popup est confirmé.
            var liste =[];
            liste.push(this.state.inputValue_1);
            liste.push(this.state.inputValue_2);

            return liste;
        }
    }
    ChequeDifPopup.template = 'ChequeDifPopup';
    ChequeDifPopup.defaultProps = {
        confirmText: 'Ok',
        cancelText: 'Cancel',
        title: '',
        body: '',
    };

    Registries.Component.add(ChequeDifPopup);

    return ChequeDifPopup;
});
