# -*- encoding: utf-8 -*-
# Copyright 2021
{
    'name': "Tit pos order",

    "version": "1.0.1",
    "author": "Sogesi",
    "website": "https://www.sogesi-dz.com",
    "sequence": 0,
    "depends": [
            "point_of_sale", "tit_base","pos_hr"
    ],
    "category": "Point of Sale",
    'license': 'LGPL-3',
    "description": """
    """,
    "data": [
        
        'security/user_security.xml',
        'templates/point_of_sale_assets.xml',
        'views/pos_cmd_vendeur_view.xml',
    ],
    'css': ['/static/src/css/cashier_screen.css'],
    'qweb': [
            "static/src/xml/Screens/profile_page.xml",
            "static/src/xml/Screens/show_new_screen.xml",
            "static/src/xml/Screens/ValidationCommandePopup.xml",
            "static/src/xml/Screens/ValidationCommandeSucces.xml",
            "static/src/xml/Menu_screens/TicketScreenCmdVendeur.xml",
            "static/src/xml/Menu_screens/category_screen.xml",
            "static/src/xml/Menu_screens/CustomTicketButtons.xml",
            "static/src/xml/Menu_screens/CmdVendeurButton.xml",
            "static/src/xml/Menu_screens/CommandesValider.xml",
            "static/src/xml/Payment_screen/Invoice.xml",
            "static/src/xml/Payment_screen/PaymentScreen.xml",

            
        ],
    'images': ['static/description/images/icon.png'],
    "auto_install": False,
    "installable": True,
    "application": False,
    
}