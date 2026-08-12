import { registerTranslations } from '../../contexts/LanguageContext';
import { lt } from './lt';

registerTranslations({
  lt,
  en: {
    'dashboardOverview.greeting.morning': 'Good Morning',
    'dashboardOverview.greeting.afternoon': 'Good Afternoon',
    'dashboardOverview.greeting.evening': 'Good Evening',
    'dashboardOverview.greeting.fallbackName': 'there',
    'dashboardOverview.summary': "Here's your financial summary",

    'dashboardOverview.account.iban': 'Your Account IBAN',
    'dashboardOverview.account.notAssigned': 'Not assigned',
    'dashboardOverview.account.copy': 'Copy',
    'dashboardOverview.account.copied': 'Copied',

    'dashboardOverview.actions.hide': 'Hide',
    'dashboardOverview.actions.show': 'Show',
    'dashboardOverview.actions.balances': 'Balances',

    'dashboardOverview.sections.fiatCurrencies': 'Fiat Currencies',
    'dashboardOverview.sections.cryptoAssets': 'Crypto Assets',

    'dashboardOverview.currencies.usd': 'US Dollar',
    'dashboardOverview.currencies.eur': 'Euro',
    'dashboardOverview.currencies.cad': 'Canadian Dollar',
    'dashboardOverview.currencies.chf': 'Swiss Franc',

    'dashboardOverview.tax.title': 'Tax Summary',
    'dashboardOverview.tax.subtitle': 'Your current tax obligations',
    'dashboardOverview.tax.pending': 'Pending',
    'dashboardOverview.tax.onHold': 'On Hold',
    'dashboardOverview.tax.paid': 'Paid',
    'dashboardOverview.tax.payTaxes': 'Pay Taxes',

    'dashboardOverview.viewAll': 'View All',

    'dashboardOverview.transactions.title': 'Recent Transactions',
    'dashboardOverview.transactions.empty': 'No transactions yet',
    'dashboardOverview.transactions.noDetails': 'No details',
    'dashboardOverview.transactions.noPoi': 'No POI',
    'dashboardOverview.transactions.status.completed': 'Completed',
    'dashboardOverview.transactions.status.pending': 'Pending',
    'dashboardOverview.transactions.status.failed': 'Failed',
    'dashboardOverview.transactions.status.rejected': 'Rejected',
    'dashboardOverview.transactions.status.cancelled': 'Cancelled',
    'dashboardOverview.transactions.status.unknown': 'Unknown',
    'dashboardOverview.transactions.type.empty': 'Not specified',
    'dashboardOverview.transactions.type.credit': 'Credit',
    'dashboardOverview.transactions.type.debit': 'Debit',
    'dashboardOverview.transactions.type.deposit': 'Deposit',
    'dashboardOverview.transactions.type.withdrawal': 'Withdrawal',
    'dashboardOverview.transactions.type.income': 'Income',
    'dashboardOverview.transactions.type.refund': 'Refund',
    'dashboardOverview.transactions.type.received': 'Received',
    'dashboardOverview.transactions.type.payment': 'Payment',
    'dashboardOverview.transactions.type.transfer': 'Transfer',
    'dashboardOverview.transactions.type.purchase': 'Purchase',
    'dashboardOverview.transactions.type.fee': 'Fee',
    'dashboardOverview.transactions.type.exchange': 'Exchange',

    'dashboardOverview.quickActions.title': 'Quick Actions',
    'dashboardOverview.quickActions.transferMoney': 'Transfer Money',
    'dashboardOverview.quickActions.transferMoneyDesc': 'Send funds quickly',
    'dashboardOverview.quickActions.transactionHistory': 'Transaction History',
    'dashboardOverview.quickActions.transactionHistoryDesc': 'View all your transactions',
    'dashboardOverview.quickActions.manageCards': 'Manage Cards',
    'dashboardOverview.quickActions.manageCardsDesc': 'Virtual & physical cards',
    'dashboardOverview.quickActions.payBills': 'Pay Bills',
    'dashboardOverview.quickActions.payBillsDesc': 'Utilities, rent & more',

    'dashboardOverview.monthlySummary.title': 'Monthly Summary',
    'dashboardOverview.monthlySummary.income': 'Income',
    'dashboardOverview.monthlySummary.expenses': 'Expenses',
    'dashboardOverview.monthlySummary.completed': 'Completed',
    'dashboardOverview.monthlySummary.pending': 'Pending',
  },

  fr: {
    'dashboardOverview.greeting.morning': 'Bonjour',
    'dashboardOverview.greeting.afternoon': 'Bon après-midi',
    'dashboardOverview.greeting.evening': 'Bonsoir',
    'dashboardOverview.greeting.fallbackName': 'à vous',
    'dashboardOverview.summary': 'Voici votre résumé financier',

    'dashboardOverview.actions.hide': 'Masquer',
    'dashboardOverview.actions.show': 'Afficher',
    'dashboardOverview.actions.balances': 'les soldes',

    'dashboardOverview.sections.fiatCurrencies': 'Devises fiduciaires',
    'dashboardOverview.sections.cryptoAssets': 'Actifs crypto',

    'dashboardOverview.currencies.usd': 'Dollar américain',
    'dashboardOverview.currencies.eur': 'Euro',
    'dashboardOverview.currencies.cad': 'Dollar canadien',
    'dashboardOverview.currencies.chf': 'Franc suisse',

    'dashboardOverview.tax.title': 'Résumé fiscal',
    'dashboardOverview.tax.subtitle': 'Vos obligations fiscales actuelles',
    'dashboardOverview.tax.pending': 'En attente',
    'dashboardOverview.tax.onHold': 'En suspens',
    'dashboardOverview.tax.paid': 'Payé',
    'dashboardOverview.tax.payTaxes': 'Payer les impôts',

    'dashboardOverview.viewAll': 'Voir tout',

    'dashboardOverview.transactions.title': 'Transactions récentes',
    'dashboardOverview.transactions.empty': 'Aucune transaction pour le moment',

    'dashboardOverview.quickActions.title': 'Actions rapides',
    'dashboardOverview.quickActions.transferMoney': 'Transférer de l’argent',
    'dashboardOverview.quickActions.transferMoneyDesc': 'Envoyez des fonds rapidement',
    'dashboardOverview.quickActions.transactionHistory': 'Historique des transactions',
    'dashboardOverview.quickActions.transactionHistoryDesc': 'Voir toutes vos transactions',
    'dashboardOverview.quickActions.manageCards': 'Gérer les cartes',
    'dashboardOverview.quickActions.manageCardsDesc': 'Cartes virtuelles et physiques',
    'dashboardOverview.quickActions.payBills': 'Payer les factures',
    'dashboardOverview.quickActions.payBillsDesc': 'Services publics, loyer et plus',

    'dashboardOverview.monthlySummary.title': 'Résumé mensuel',
    'dashboardOverview.monthlySummary.income': 'Revenus',
    'dashboardOverview.monthlySummary.expenses': 'Dépenses',
  },

  de: {
    'dashboardOverview.greeting.morning': 'Guten Morgen',
    'dashboardOverview.greeting.afternoon': 'Guten Tag',
    'dashboardOverview.greeting.evening': 'Guten Abend',
    'dashboardOverview.greeting.fallbackName': 'da',
    'dashboardOverview.summary': 'Hier ist Ihre Finanzübersicht',

    'dashboardOverview.actions.hide': 'Ausblenden',
    'dashboardOverview.actions.show': 'Anzeigen',
    'dashboardOverview.actions.balances': 'Kontostände',

    'dashboardOverview.sections.fiatCurrencies': 'Fiat-Währungen',
    'dashboardOverview.sections.cryptoAssets': 'Krypto-Assets',

    'dashboardOverview.currencies.usd': 'US-Dollar',
    'dashboardOverview.currencies.eur': 'Euro',
    'dashboardOverview.currencies.cad': 'Kanadischer Dollar',
    'dashboardOverview.currencies.chf': 'Schweizer Franken',

    'dashboardOverview.tax.title': 'Steuerübersicht',
    'dashboardOverview.tax.subtitle': 'Ihre aktuellen Steuerverpflichtungen',
    'dashboardOverview.tax.pending': 'Ausstehend',
    'dashboardOverview.tax.onHold': 'Zurückgestellt',
    'dashboardOverview.tax.paid': 'Bezahlt',
    'dashboardOverview.tax.payTaxes': 'Steuern zahlen',

    'dashboardOverview.viewAll': 'Alle anzeigen',

    'dashboardOverview.transactions.title': 'Letzte Transaktionen',
    'dashboardOverview.transactions.empty': 'Noch keine Transaktionen',

    'dashboardOverview.quickActions.title': 'Schnellaktionen',
    'dashboardOverview.quickActions.transferMoney': 'Geld überweisen',
    'dashboardOverview.quickActions.transferMoneyDesc': 'Schnell Geld senden',
    'dashboardOverview.quickActions.transactionHistory': 'Transaktionsverlauf',
    'dashboardOverview.quickActions.transactionHistoryDesc': 'Alle Ihre Transaktionen ansehen',
    'dashboardOverview.quickActions.manageCards': 'Karten verwalten',
    'dashboardOverview.quickActions.manageCardsDesc': 'Virtuelle und physische Karten',
    'dashboardOverview.quickActions.payBills': 'Rechnungen bezahlen',
    'dashboardOverview.quickActions.payBillsDesc': 'Nebenkosten, Miete und mehr',

    'dashboardOverview.monthlySummary.title': 'Monatsübersicht',
    'dashboardOverview.monthlySummary.income': 'Einnahmen',
    'dashboardOverview.monthlySummary.expenses': 'Ausgaben',
  },

  es: {
    'dashboardOverview.greeting.morning': 'Buenos días',
    'dashboardOverview.greeting.afternoon': 'Buenas tardes',
    'dashboardOverview.greeting.evening': 'Buenas noches',
    'dashboardOverview.greeting.fallbackName': 'amigo',
    'dashboardOverview.summary': 'Aquí tienes tu resumen financiero',

    'dashboardOverview.actions.hide': 'Ocultar',
    'dashboardOverview.actions.show': 'Mostrar',
    'dashboardOverview.actions.balances': 'saldos',

    'dashboardOverview.sections.fiatCurrencies': 'Monedas fiduciarias',
    'dashboardOverview.sections.cryptoAssets': 'Activos cripto',

    'dashboardOverview.currencies.usd': 'Dólar estadounidense',
    'dashboardOverview.currencies.eur': 'Euro',
    'dashboardOverview.currencies.cad': 'Dólar canadiense',
    'dashboardOverview.currencies.chf': 'Franco suizo',

    'dashboardOverview.tax.title': 'Resumen fiscal',
    'dashboardOverview.tax.subtitle': 'Tus obligaciones fiscales actuales',
    'dashboardOverview.tax.pending': 'Pendiente',
    'dashboardOverview.tax.onHold': 'En espera',
    'dashboardOverview.tax.paid': 'Pagado',
    'dashboardOverview.tax.payTaxes': 'Pagar impuestos',

    'dashboardOverview.viewAll': 'Ver todo',

    'dashboardOverview.transactions.title': 'Transacciones recientes',
    'dashboardOverview.transactions.empty': 'Aún no hay transacciones',

    'dashboardOverview.quickActions.title': 'Acciones rápidas',
    'dashboardOverview.quickActions.transferMoney': 'Transferir dinero',
    'dashboardOverview.quickActions.transferMoneyDesc': 'Envía fondos rápidamente',
    'dashboardOverview.quickActions.transactionHistory': 'Historial de transacciones',
    'dashboardOverview.quickActions.transactionHistoryDesc': 'Ver todas tus transacciones',
    'dashboardOverview.quickActions.manageCards': 'Gestionar tarjetas',
    'dashboardOverview.quickActions.manageCardsDesc': 'Tarjetas virtuales y físicas',
    'dashboardOverview.quickActions.payBills': 'Pagar facturas',
    'dashboardOverview.quickActions.payBillsDesc': 'Servicios, alquiler y más',

    'dashboardOverview.monthlySummary.title': 'Resumen mensual',
    'dashboardOverview.monthlySummary.income': 'Ingresos',
    'dashboardOverview.monthlySummary.expenses': 'Gastos',
  },

  it: {
    'dashboardOverview.greeting.morning': 'Buongiorno',
    'dashboardOverview.greeting.afternoon': 'Buon pomeriggio',
    'dashboardOverview.greeting.evening': 'Buonasera',
    'dashboardOverview.greeting.fallbackName': 'a te',
    'dashboardOverview.summary': 'Ecco il tuo riepilogo finanziario',

    'dashboardOverview.actions.hide': 'Nascondi',
    'dashboardOverview.actions.show': 'Mostra',
    'dashboardOverview.actions.balances': 'saldi',

    'dashboardOverview.sections.fiatCurrencies': 'Valute fiat',
    'dashboardOverview.sections.cryptoAssets': 'Asset crypto',

    'dashboardOverview.currencies.usd': 'Dollaro USA',
    'dashboardOverview.currencies.eur': 'Euro',
    'dashboardOverview.currencies.cad': 'Dollaro canadese',
    'dashboardOverview.currencies.chf': 'Franco svizzero',

    'dashboardOverview.tax.title': 'Riepilogo fiscale',
    'dashboardOverview.tax.subtitle': 'I tuoi obblighi fiscali attuali',
    'dashboardOverview.tax.pending': 'In sospeso',
    'dashboardOverview.tax.onHold': 'In pausa',
    'dashboardOverview.tax.paid': 'Pagato',
    'dashboardOverview.tax.payTaxes': 'Paga le tasse',

    'dashboardOverview.viewAll': 'Vedi tutto',

    'dashboardOverview.transactions.title': 'Transazioni recenti',
    'dashboardOverview.transactions.empty': 'Nessuna transazione al momento',

    'dashboardOverview.quickActions.title': 'Azioni rapide',
    'dashboardOverview.quickActions.transferMoney': 'Trasferisci denaro',
    'dashboardOverview.quickActions.transferMoneyDesc': 'Invia fondi rapidamente',
    'dashboardOverview.quickActions.transactionHistory': 'Cronologia transazioni',
    'dashboardOverview.quickActions.transactionHistoryDesc': 'Visualizza tutte le tue transazioni',
    'dashboardOverview.quickActions.manageCards': 'Gestisci carte',
    'dashboardOverview.quickActions.manageCardsDesc': 'Carte virtuali e fisiche',
    'dashboardOverview.quickActions.payBills': 'Paga bollette',
    'dashboardOverview.quickActions.payBillsDesc': 'Utenze, affitto e altro',

    'dashboardOverview.monthlySummary.title': 'Riepilogo mensile',
    'dashboardOverview.monthlySummary.income': 'Entrate',
    'dashboardOverview.monthlySummary.expenses': 'Spese',
  },

  el: {
    'dashboardOverview.greeting.morning': 'Καλημέρα',
    'dashboardOverview.greeting.afternoon': 'Καλησπέρα',
    'dashboardOverview.greeting.evening': 'Καλησπέρα',
    'dashboardOverview.greeting.fallbackName': 'εκεί',
    'dashboardOverview.summary': 'Ακολουθεί η οικονομική σας σύνοψη',

    'dashboardOverview.actions.hide': 'Απόκρυψη',
    'dashboardOverview.actions.show': 'Εμφάνιση',
    'dashboardOverview.actions.balances': 'υπολοίπων',

    'dashboardOverview.sections.fiatCurrencies': 'Παραδοσιακά νομίσματα',
    'dashboardOverview.sections.cryptoAssets': 'Κρυπτονομίσματα',

    'dashboardOverview.currencies.usd': 'Δολάριο ΗΠΑ',
    'dashboardOverview.currencies.eur': 'Ευρώ',
    'dashboardOverview.currencies.cad': 'Καναδικό δολάριο',
    'dashboardOverview.currencies.chf': 'Ελβετικό φράγκο',

    'dashboardOverview.tax.title': 'Φορολογική σύνοψη',
    'dashboardOverview.tax.subtitle': 'Οι τρέχουσες φορολογικές σας υποχρεώσεις',
    'dashboardOverview.tax.pending': 'Σε εκκρεμότητα',
    'dashboardOverview.tax.onHold': 'Σε αναμονή',
    'dashboardOverview.tax.paid': 'Πληρωμένο',
    'dashboardOverview.tax.payTaxes': 'Πληρωμή φόρων',

    'dashboardOverview.viewAll': 'Προβολή όλων',

    'dashboardOverview.transactions.title': 'Πρόσφατες συναλλαγές',
    'dashboardOverview.transactions.empty': 'Δεν υπάρχουν συναλλαγές ακόμη',

    'dashboardOverview.quickActions.title': 'Γρήγορες ενέργειες',
    'dashboardOverview.quickActions.transferMoney': 'Μεταφορά χρημάτων',
    'dashboardOverview.quickActions.transferMoneyDesc': 'Στείλτε χρήματα γρήγορα',
    'dashboardOverview.quickActions.transactionHistory': 'Ιστορικό συναλλαγών',
    'dashboardOverview.quickActions.transactionHistoryDesc': 'Δείτε όλες τις συναλλαγές σας',
    'dashboardOverview.quickActions.manageCards': 'Διαχείριση καρτών',
    'dashboardOverview.quickActions.manageCardsDesc': 'Εικονικές και φυσικές κάρτες',
    'dashboardOverview.quickActions.payBills': 'Πληρωμή λογαριασμών',
    'dashboardOverview.quickActions.payBillsDesc': 'Λογαριασμοί, ενοίκιο και άλλα',

    'dashboardOverview.monthlySummary.title': 'Μηνιαία σύνοψη',
    'dashboardOverview.monthlySummary.income': 'Έσοδα',
    'dashboardOverview.monthlySummary.expenses': 'Έξοδα',
  },

  pl: {
    'dashboardOverview.greeting.morning': 'Dzień dobry',
    'dashboardOverview.greeting.afternoon': 'Dzień dobry',
    'dashboardOverview.greeting.evening': 'Dobry wieczór',
    'dashboardOverview.greeting.fallbackName': 'użytkowniku',
    'dashboardOverview.summary': 'Oto Twoje podsumowanie finansowe',

    'dashboardOverview.account.iban': 'IBAN Twojego rachunku',
    'dashboardOverview.account.notAssigned': 'Nie przypisano',
    'dashboardOverview.account.copy': 'Kopiuj',
    'dashboardOverview.account.copied': 'Skopiowano',

    'dashboardOverview.actions.hide': 'Ukryj',
    'dashboardOverview.actions.show': 'Pokaż',
    'dashboardOverview.actions.balances': 'salda',

    'dashboardOverview.sections.fiatCurrencies': 'Waluty tradycyjne',
    'dashboardOverview.sections.cryptoAssets': 'Kryptoaktywa',

    'dashboardOverview.currencies.usd': 'Dolar amerykański',
    'dashboardOverview.currencies.eur': 'Euro',
    'dashboardOverview.currencies.cad': 'Dolar kanadyjski',
    'dashboardOverview.currencies.chf': 'Frank szwajcarski',

    'dashboardOverview.tax.title': 'Podsumowanie podatkowe',
    'dashboardOverview.tax.subtitle': 'Twoje bieżące zobowiązania podatkowe',
    'dashboardOverview.tax.pending': 'Oczekujące',
    'dashboardOverview.tax.onHold': 'Wstrzymane',
    'dashboardOverview.tax.paid': 'Zapłacone',
    'dashboardOverview.tax.payTaxes': 'Zapłać podatki',

    'dashboardOverview.viewAll': 'Zobacz wszystkie',

    'dashboardOverview.transactions.title': 'Ostatnie transakcje',
    'dashboardOverview.transactions.empty': 'Brak transakcji',
    'dashboardOverview.transactions.noDetails': 'Brak szczegółów',
    'dashboardOverview.transactions.noPoi': 'Brak POI',
    'dashboardOverview.transactions.status.completed': 'Zakończona',
    'dashboardOverview.transactions.status.pending': 'Oczekująca',
    'dashboardOverview.transactions.status.failed': 'Nieudana',
    'dashboardOverview.transactions.status.rejected': 'Odrzucona',
    'dashboardOverview.transactions.status.cancelled': 'Anulowana',
    'dashboardOverview.transactions.status.unknown': 'Nieznany status',
    'dashboardOverview.transactions.type.empty': 'Nie określono',
    'dashboardOverview.transactions.type.credit': 'Uznanie',
    'dashboardOverview.transactions.type.debit': 'Obciążenie',
    'dashboardOverview.transactions.type.deposit': 'Wpłata',
    'dashboardOverview.transactions.type.withdrawal': 'Wypłata',
    'dashboardOverview.transactions.type.income': 'Przychód',
    'dashboardOverview.transactions.type.refund': 'Zwrot',
    'dashboardOverview.transactions.type.received': 'Otrzymano',
    'dashboardOverview.transactions.type.payment': 'Płatność',
    'dashboardOverview.transactions.type.transfer': 'Przelew',
    'dashboardOverview.transactions.type.purchase': 'Zakup',
    'dashboardOverview.transactions.type.fee': 'Opłata',
    'dashboardOverview.transactions.type.exchange': 'Wymiana walut',

    'dashboardOverview.quickActions.title': 'Szybkie działania',
    'dashboardOverview.quickActions.transferMoney': 'Przelej pieniądze',
    'dashboardOverview.quickActions.transferMoneyDesc': 'Szybko wyślij środki',
    'dashboardOverview.quickActions.transactionHistory': 'Historia transakcji',
    'dashboardOverview.quickActions.transactionHistoryDesc': 'Zobacz wszystkie transakcje',
    'dashboardOverview.quickActions.manageCards': 'Zarządzaj kartami',
    'dashboardOverview.quickActions.manageCardsDesc': 'Karty wirtualne i fizyczne',
    'dashboardOverview.quickActions.payBills': 'Opłać rachunki',
    'dashboardOverview.quickActions.payBillsDesc': 'Media, czynsz i inne opłaty',

    'dashboardOverview.monthlySummary.title': 'Podsumowanie miesięczne',
    'dashboardOverview.monthlySummary.income': 'Wpływy',
    'dashboardOverview.monthlySummary.expenses': 'Wydatki',
    'dashboardOverview.monthlySummary.completed': 'Zakończone',
    'dashboardOverview.monthlySummary.pending': 'Oczekujące',
  },
});
