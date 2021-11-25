# -*- encoding: utf-8 -*-
# Copyright 2021
{
    'name': "Tit pos avoir sur Facture",
    "version": "1.0.1",
    "author": "Sogesi",
    "website": "https://www.sogesi-dz.com",
    "sequence": 0,
    "depends": [
            "point_of_sale", "tit_pos_cmd_facture", "ks_pos_low_stock_alert"
    ],
    "category": "Point of Sale",
    'license': 'LGPL-3',
    "description": """
        Ce module permet de gérer l'avoir sur facture depuis le pos
    """,
    "data": [
        'templates/point_of_sale_assets.xml',
    ],
    'qweb': [
            'static/src/xml/Screens/facture_button.xml',
            'static/src/xml/Detail_screen/FactureDetails_factPaye.xml',
            'static/src/xml/Detail_screen/FactureSavePaiement_factPaye.xml',
            'static/src/xml/Menu_screens/FacturesPayee.xml',
            'static/src/xml/Menu_screens/FacturesAvoir.xml',
    ],
    'images': ['static/description/images/icon.png'],
    "auto_install": False,
    "installable": True,
    "application": False,
    
}