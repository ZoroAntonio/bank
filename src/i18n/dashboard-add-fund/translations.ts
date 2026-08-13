import { registerTranslations } from '../../contexts/LanguageContext';
import { lt } from './lt';
import { pl } from './pl';

registerTranslations({
  lt,
  pl,
  en: {
    'dashboardAddFund.title': 'Add Fund',
    'dashboardAddFund.subtitle': 'Deposit crypto assets into your account',

    'dashboardAddFund.actions.addFund': 'Add Fund',
    'dashboardAddFund.actions.copyAddress': 'Copy address',
    'dashboardAddFund.actions.submitting': 'Submitting...',
    'dashboardAddFund.actions.submitDeposit': 'Submit Deposit',
    'dashboardAddFund.actions.cancel': 'Cancel',

    'dashboardAddFund.messages.depositOf': 'Deposit of',
    'dashboardAddFund.messages.submitted': 'submitted -- awaiting confirmation',
    'dashboardAddFund.messages.addressCopied': 'Address copied to clipboard',
    'dashboardAddFund.messages.notAuthenticated': 'You must be signed in to submit a deposit.',
    'dashboardAddFund.messages.submissionError': 'The deposit request could not be submitted. Please try again.',
    'dashboardAddFund.messages.walletUnavailable': 'A valid deposit wallet has not been configured for this asset. Contact support before sending funds.',

    'dashboardAddFund.form.title': 'Deposit Crypto',
    'dashboardAddFund.form.selectAsset': 'Select Asset',
    'dashboardAddFund.form.balanceShort': 'Bal',
    'dashboardAddFund.form.scanToGetAddress': 'Scan to get address',
    'dashboardAddFund.form.walletAddress': 'Wallet Address',
    'dashboardAddFund.form.deposit': 'Deposit',
    'dashboardAddFund.form.amount': 'Amount',
    'dashboardAddFund.form.warning1': 'Send only',
    'dashboardAddFund.form.warning2': 'to this address on the',
    'dashboardAddFund.form.warning3': 'network. Sending any other asset may result in permanent loss.',

    'dashboardAddFund.placeholders.amount': '0.00',

    'dashboardAddFund.summary.asset': 'Asset',
    'dashboardAddFund.summary.network': 'Network',
    'dashboardAddFund.summary.status': 'Status',
    'dashboardAddFund.summary.depositAmount': 'Deposit Amount',

    'dashboardAddFund.history.title': 'Deposit History',

    'dashboardAddFund.empty.title': 'No deposits yet',
    'dashboardAddFund.empty.subtitle': 'Add crypto funds to your account to get started',
    'dashboardAddFund.empty.cta': 'Add Your First Fund',

    'dashboardAddFund.status.approved': 'Approved',
    'dashboardAddFund.status.completed': 'Completed',
    'dashboardAddFund.status.pending': 'Pending',
    'dashboardAddFund.status.failed': 'Failed',
  },

  fr: {
    'dashboardAddFund.title': 'Ajouter des fonds',
    'dashboardAddFund.subtitle': 'Déposez des actifs crypto sur votre compte',

    'dashboardAddFund.actions.addFund': 'Ajouter des fonds',
    'dashboardAddFund.actions.copyAddress': 'Copier l’adresse',
    'dashboardAddFund.actions.submitting': 'Envoi...',
    'dashboardAddFund.actions.submitDeposit': 'Soumettre le dépôt',
    'dashboardAddFund.actions.cancel': 'Annuler',

    'dashboardAddFund.messages.depositOf': 'Dépôt de',
    'dashboardAddFund.messages.submitted': 'soumis -- en attente de confirmation',
    'dashboardAddFund.messages.addressCopied': 'Adresse copiée dans le presse-papiers',
    'dashboardAddFund.messages.notAuthenticated': 'Vous devez être connecté pour soumettre un dépôt.',
    'dashboardAddFund.messages.submissionError': 'La demande de dépôt n’a pas pu être envoyée. Veuillez réessayer.',
    'dashboardAddFund.messages.walletUnavailable': 'Aucun portefeuille de dépôt valide n’est configuré pour cet actif. Contactez l’assistance avant d’envoyer des fonds.',

    'dashboardAddFund.form.title': 'Déposer des cryptos',
    'dashboardAddFund.form.selectAsset': 'Sélectionner un actif',
    'dashboardAddFund.form.balanceShort': 'Solde',
    'dashboardAddFund.form.scanToGetAddress': 'Scanner pour obtenir l’adresse',
    'dashboardAddFund.form.walletAddress': 'Adresse du portefeuille',
    'dashboardAddFund.form.deposit': 'Dépôt',
    'dashboardAddFund.form.amount': 'Montant',
    'dashboardAddFund.form.warning1': 'Envoyez uniquement',
    'dashboardAddFund.form.warning2': 'à cette adresse sur le réseau',
    'dashboardAddFund.form.warning3': '. L’envoi de tout autre actif peut entraîner une perte définitive.',

    'dashboardAddFund.placeholders.amount': '0.00',

    'dashboardAddFund.summary.asset': 'Actif',
    'dashboardAddFund.summary.network': 'Réseau',
    'dashboardAddFund.summary.status': 'Statut',
    'dashboardAddFund.summary.depositAmount': 'Montant du dépôt',

    'dashboardAddFund.history.title': 'Historique des dépôts',

    'dashboardAddFund.empty.title': 'Aucun dépôt pour le moment',
    'dashboardAddFund.empty.subtitle': 'Ajoutez des fonds crypto à votre compte pour commencer',
    'dashboardAddFund.empty.cta': 'Ajouter votre premier fonds',

    'dashboardAddFund.status.approved': 'Approuvé',
    'dashboardAddFund.status.completed': 'Terminé',
    'dashboardAddFund.status.pending': 'En attente',
    'dashboardAddFund.status.failed': 'Échoué',
  },

  de: {
    'dashboardAddFund.title': 'Geld hinzufügen',
    'dashboardAddFund.subtitle': 'Zahlen Sie Krypto-Assets auf Ihr Konto ein',

    'dashboardAddFund.actions.addFund': 'Geld hinzufügen',
    'dashboardAddFund.actions.copyAddress': 'Adresse kopieren',
    'dashboardAddFund.actions.submitting': 'Wird gesendet...',
    'dashboardAddFund.actions.submitDeposit': 'Einzahlung senden',
    'dashboardAddFund.actions.cancel': 'Abbrechen',

    'dashboardAddFund.messages.depositOf': 'Einzahlung von',
    'dashboardAddFund.messages.submitted': 'eingereicht -- wartet auf Bestätigung',
    'dashboardAddFund.messages.addressCopied': 'Adresse in die Zwischenablage kopiert',
    'dashboardAddFund.messages.notAuthenticated': 'Sie müssen angemeldet sein, um eine Einzahlung einzureichen.',
    'dashboardAddFund.messages.submissionError': 'Die Einzahlungsanfrage konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.',
    'dashboardAddFund.messages.walletUnavailable': 'Für dieses Asset ist keine gültige Einzahlungs-Wallet eingerichtet. Kontaktieren Sie den Support, bevor Sie Geld senden.',

    'dashboardAddFund.form.title': 'Krypto einzahlen',
    'dashboardAddFund.form.selectAsset': 'Asset auswählen',
    'dashboardAddFund.form.balanceShort': 'Bestand',
    'dashboardAddFund.form.scanToGetAddress': 'Scannen, um Adresse zu erhalten',
    'dashboardAddFund.form.walletAddress': 'Wallet-Adresse',
    'dashboardAddFund.form.deposit': 'Einzahlung',
    'dashboardAddFund.form.amount': 'Betrag',
    'dashboardAddFund.form.warning1': 'Senden Sie nur',
    'dashboardAddFund.form.warning2': 'an diese Adresse im',
    'dashboardAddFund.form.warning3': 'Netzwerk. Das Senden anderer Assets kann zu dauerhaftem Verlust führen.',

    'dashboardAddFund.placeholders.amount': '0.00',

    'dashboardAddFund.summary.asset': 'Asset',
    'dashboardAddFund.summary.network': 'Netzwerk',
    'dashboardAddFund.summary.status': 'Status',
    'dashboardAddFund.summary.depositAmount': 'Einzahlungsbetrag',

    'dashboardAddFund.history.title': 'Einzahlungsverlauf',

    'dashboardAddFund.empty.title': 'Noch keine Einzahlungen',
    'dashboardAddFund.empty.subtitle': 'Zahlen Sie Krypto auf Ihr Konto ein, um zu beginnen',
    'dashboardAddFund.empty.cta': 'Erste Einzahlung hinzufügen',

    'dashboardAddFund.status.approved': 'Genehmigt',
    'dashboardAddFund.status.completed': 'Abgeschlossen',
    'dashboardAddFund.status.pending': 'Ausstehend',
    'dashboardAddFund.status.failed': 'Fehlgeschlagen',
  },

  es: {
    'dashboardAddFund.title': 'Agregar fondos',
    'dashboardAddFund.subtitle': 'Deposita activos cripto en tu cuenta',

    'dashboardAddFund.actions.addFund': 'Agregar fondos',
    'dashboardAddFund.actions.copyAddress': 'Copiar dirección',
    'dashboardAddFund.actions.submitting': 'Enviando...',
    'dashboardAddFund.actions.submitDeposit': 'Enviar depósito',
    'dashboardAddFund.actions.cancel': 'Cancelar',

    'dashboardAddFund.messages.depositOf': 'Depósito de',
    'dashboardAddFund.messages.submitted': 'enviado -- pendiente de confirmación',
    'dashboardAddFund.messages.addressCopied': 'Dirección copiada al portapapeles',
    'dashboardAddFund.messages.notAuthenticated': 'Debes iniciar sesión para enviar un depósito.',
    'dashboardAddFund.messages.submissionError': 'No se pudo enviar la solicitud de depósito. Inténtalo de nuevo.',
    'dashboardAddFund.messages.walletUnavailable': 'No hay una billetera de depósito válida configurada para este activo. Contacta con soporte antes de enviar fondos.',

    'dashboardAddFund.form.title': 'Depositar cripto',
    'dashboardAddFund.form.selectAsset': 'Seleccionar activo',
    'dashboardAddFund.form.balanceShort': 'Saldo',
    'dashboardAddFund.form.scanToGetAddress': 'Escanea para obtener la dirección',
    'dashboardAddFund.form.walletAddress': 'Dirección de la billetera',
    'dashboardAddFund.form.deposit': 'Depósito',
    'dashboardAddFund.form.amount': 'Monto',
    'dashboardAddFund.form.warning1': 'Envía solo',
    'dashboardAddFund.form.warning2': 'a esta dirección en la red',
    'dashboardAddFund.form.warning3': '. Enviar cualquier otro activo puede provocar una pérdida permanente.',

    'dashboardAddFund.placeholders.amount': '0.00',

    'dashboardAddFund.summary.asset': 'Activo',
    'dashboardAddFund.summary.network': 'Red',
    'dashboardAddFund.summary.status': 'Estado',
    'dashboardAddFund.summary.depositAmount': 'Monto del depósito',

    'dashboardAddFund.history.title': 'Historial de depósitos',

    'dashboardAddFund.empty.title': 'Aún no hay depósitos',
    'dashboardAddFund.empty.subtitle': 'Agrega fondos cripto a tu cuenta para comenzar',
    'dashboardAddFund.empty.cta': 'Agrega tu primer fondo',

    'dashboardAddFund.status.approved': 'Aprobado',
    'dashboardAddFund.status.completed': 'Completado',
    'dashboardAddFund.status.pending': 'Pendiente',
    'dashboardAddFund.status.failed': 'Fallido',
  },

  it: {
    'dashboardAddFund.title': 'Aggiungi fondi',
    'dashboardAddFund.subtitle': 'Deposita asset crypto nel tuo account',

    'dashboardAddFund.actions.addFund': 'Aggiungi fondi',
    'dashboardAddFund.actions.copyAddress': 'Copia indirizzo',
    'dashboardAddFund.actions.submitting': 'Invio...',
    'dashboardAddFund.actions.submitDeposit': 'Invia deposito',
    'dashboardAddFund.actions.cancel': 'Annulla',

    'dashboardAddFund.messages.depositOf': 'Deposito di',
    'dashboardAddFund.messages.submitted': 'inviato -- in attesa di conferma',
    'dashboardAddFund.messages.addressCopied': 'Indirizzo copiato negli appunti',
    'dashboardAddFund.messages.notAuthenticated': 'Devi aver effettuato l’accesso per inviare un deposito.',
    'dashboardAddFund.messages.submissionError': 'Non è stato possibile inviare la richiesta di deposito. Riprova.',
    'dashboardAddFund.messages.walletUnavailable': 'Per questo asset non è configurato un wallet di deposito valido. Contatta l’assistenza prima di inviare fondi.',

    'dashboardAddFund.form.title': 'Deposita crypto',
    'dashboardAddFund.form.selectAsset': 'Seleziona asset',
    'dashboardAddFund.form.balanceShort': 'Saldo',
    'dashboardAddFund.form.scanToGetAddress': 'Scansiona per ottenere l’indirizzo',
    'dashboardAddFund.form.walletAddress': 'Indirizzo wallet',
    'dashboardAddFund.form.deposit': 'Deposito',
    'dashboardAddFund.form.amount': 'Importo',
    'dashboardAddFund.form.warning1': 'Invia solo',
    'dashboardAddFund.form.warning2': 'a questo indirizzo sulla rete',
    'dashboardAddFund.form.warning3': '. L’invio di qualsiasi altro asset può causare una perdita permanente.',

    'dashboardAddFund.placeholders.amount': '0.00',

    'dashboardAddFund.summary.asset': 'Asset',
    'dashboardAddFund.summary.network': 'Rete',
    'dashboardAddFund.summary.status': 'Stato',
    'dashboardAddFund.summary.depositAmount': 'Importo del deposito',

    'dashboardAddFund.history.title': 'Cronologia depositi',

    'dashboardAddFund.empty.title': 'Nessun deposito ancora',
    'dashboardAddFund.empty.subtitle': 'Aggiungi fondi crypto al tuo account per iniziare',
    'dashboardAddFund.empty.cta': 'Aggiungi il tuo primo fondo',

    'dashboardAddFund.status.approved': 'Approvato',
    'dashboardAddFund.status.completed': 'Completato',
    'dashboardAddFund.status.pending': 'In attesa',
    'dashboardAddFund.status.failed': 'Fallito',
  },

  el: {
    'dashboardAddFund.title': 'Προσθήκη κεφαλαίων',
    'dashboardAddFund.subtitle': 'Καταθέστε crypto assets στον λογαριασμό σας',

    'dashboardAddFund.actions.addFund': 'Προσθήκη κεφαλαίων',
    'dashboardAddFund.actions.copyAddress': 'Αντιγραφή διεύθυνσης',
    'dashboardAddFund.actions.submitting': 'Υποβολή...',
    'dashboardAddFund.actions.submitDeposit': 'Υποβολή κατάθεσης',
    'dashboardAddFund.actions.cancel': 'Ακύρωση',

    'dashboardAddFund.messages.depositOf': 'Κατάθεση',
    'dashboardAddFund.messages.submitted': 'υποβλήθηκε -- αναμένεται επιβεβαίωση',
    'dashboardAddFund.messages.addressCopied': 'Η διεύθυνση αντιγράφηκε στο πρόχειρο',
    'dashboardAddFund.messages.notAuthenticated': 'Πρέπει να συνδεθείτε για να υποβάλετε κατάθεση.',
    'dashboardAddFund.messages.submissionError': 'Δεν ήταν δυνατή η υποβολή του αιτήματος κατάθεσης. Δοκιμάστε ξανά.',
    'dashboardAddFund.messages.walletUnavailable': 'Δεν έχει ρυθμιστεί έγκυρο πορτοφόλι κατάθεσης για αυτό το στοιχείο. Επικοινωνήστε με την υποστήριξη πριν στείλετε χρήματα.',

    'dashboardAddFund.form.title': 'Κατάθεση crypto',
    'dashboardAddFund.form.selectAsset': 'Επιλογή asset',
    'dashboardAddFund.form.balanceShort': 'Υπόλ.',
    'dashboardAddFund.form.scanToGetAddress': 'Σάρωση για λήψη διεύθυνσης',
    'dashboardAddFund.form.walletAddress': 'Διεύθυνση wallet',
    'dashboardAddFund.form.deposit': 'Κατάθεση',
    'dashboardAddFund.form.amount': 'Ποσό',
    'dashboardAddFund.form.warning1': 'Στείλτε μόνο',
    'dashboardAddFund.form.warning2': 'σε αυτή τη διεύθυνση στο δίκτυο',
    'dashboardAddFund.form.warning3': '. Η αποστολή οποιουδήποτε άλλου asset μπορεί να οδηγήσει σε μόνιμη απώλεια.',

    'dashboardAddFund.placeholders.amount': '0.00',

    'dashboardAddFund.summary.asset': 'Asset',
    'dashboardAddFund.summary.network': 'Δίκτυο',
    'dashboardAddFund.summary.status': 'Κατάσταση',
    'dashboardAddFund.summary.depositAmount': 'Ποσό κατάθεσης',

    'dashboardAddFund.history.title': 'Ιστορικό καταθέσεων',

    'dashboardAddFund.empty.title': 'Δεν υπάρχουν καταθέσεις ακόμα',
    'dashboardAddFund.empty.subtitle': 'Προσθέστε crypto κεφάλαια στον λογαριασμό σας για να ξεκινήσετε',
    'dashboardAddFund.empty.cta': 'Προσθέστε το πρώτο σας κεφάλαιο',

    'dashboardAddFund.status.approved': 'Εγκρίθηκε',
    'dashboardAddFund.status.completed': 'Ολοκληρώθηκε',
    'dashboardAddFund.status.pending': 'Σε εκκρεμότητα',
    'dashboardAddFund.status.failed': 'Απέτυχε',
  },
});
