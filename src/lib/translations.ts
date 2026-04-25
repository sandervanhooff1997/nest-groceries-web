export const translations = {
  // Navigation & Common
  dashboard: 'Dashboard',
  shoppingLists: 'Boodschappenlijsten',
  backToAllLists: 'Terug',
  logout: 'Uitloggen',
  login: 'Inloggen',

  // Dashboard
  myShoppingLists: 'Boodschappenlijsten',
  createNewList: 'Nieuwe Lijst',
  noListsYet: 'Je hebt nog geen boodschappenlijsten. Maak er een aan om te beginnen!',
  searchPlaceholder: 'Zoeken in lijsten...',

  // Shopping List Cards
  items: 'artikelen',
  lastModified: 'Laatst gewijzigd',
  template: 'Sjabloon',
  coOwner: 'Mede-eigenaar',
  participant: 'Deelnemer',

  // Create List Modal
  listName: 'Lijstnaam',
  enterListName: 'Voer een lijstnaam in…',
  saveAsTemplate: 'Opslaan als sjabloon',
  useTemplates: 'Sjablonen',
  noTemplates: 'Je hebt nog geen templates. Maak je eerste boodschappenlijst aan en sla deze op als template!',
  selectTemplates: 'Selecteer templates:',
  itemCount: 'artikelen',
  cancel: 'Annuleren',
  create: 'Creëren',

  // Shopping List Detail
  addItem: 'Artikel toevoegen',
  itemName: 'Naam artikel…',
  qty: 'Aantal',
  quantity: 'Artikelen',
  unit: 'Eenheid',
  unitOfMeasurement: 'Eenheid',
  add: 'Toevoegen',
  adding: 'Toevoegen…',
  items_list: 'Artikelen',
  purchased: 'gekocht',
  noItemsYet: 'Nog geen artikelen. Voeg er boven een toe!',
  dragToReorder: 'Sleep om opnieuw in te delen',
  markAsPurchased: 'Markeer als gekocht',
  markAsNotPurchased: 'Markeer als niet gekocht',
  removeItemFromList: 'Verwijder artikel uit lijst',
  clickToEdit: 'Klik om te bewerken',
  save: 'Opslaan',
  cancel_action: 'Annuleren',

  // List Actions
  manageSharedAccess: 'Beheer gedeelde toegang',
  shareList: 'Deel lijst',
  duplicateThisList: 'Dupliceer deze lijst',
  deleteThisListPermanently: 'Verwijder deze lijst definitief',
  deleteConfirmation: 'Verwijder deze boodschappenlijst? Dit kan niet ongedaan worden gemaakt.',

  // Duplicate Modal
  selectItemsToDuplicate: 'Selecteer artikelen om te dupliceren:',
  selectAll: 'Alles selecteren',
  deselectAll: 'Niets selecteren',
  overrideQuantity: 'Hoeveelheid overschrijven?',
  duplicateSelectedItems: 'Dupliceer geselecteerde artikelen',
  duplicating: 'Dupliceren…',

  // Sharing
  sharedWith: 'Gedeeld met',
  email: 'E-mail',
  role: 'Rol',
  coOwnerRole: 'Mede-eigenaar',
  participantRole: 'Deelnemer',
  addUser: 'Gebruiker toevoegen',
  removeAccess: 'Toegang verwijderen',
  enterEmail: 'Voer e-mailadres in…',
  confirmEmail: 'Bevestig',
  removing: 'Verwijderen…',

  // Units
  pieces: 'Stuk(s)',
  gram: 'Gram',
  kilogram: 'Kilogram',
  liter: 'Liter',
  milliliter: 'Milliliter',

  // Error messages
  failedToFetchList: 'Fout bij ophalen van lijst',
  failedToAddItem: 'Fout bij toevoegen van artikel',
  failedToUpdateItem: 'Fout bij bijwerken van artikel',
  failedToRemoveItem: 'Fout bij verwijderen van artikel',
  failedToDeleteList: 'Fout bij verwijderen van lijst',
  failedToSaveOrder: 'Fout bij opslaan van volgorde',
  failedToDuplicateList: 'Fout bij dupliceren van lijst',
  somethingWentWrong: 'Er is iets misgegaan',

  // Loading
  loading: 'Laden…',
  loadingList: 'Lijst laden…',
  savingOrder: 'Volgorde opslaan…',

  // Category Labels (for reference, not shown)
  fruitVegetables: 'Fruit & Groente',
  bread: 'Brood',
  meatDeli: 'Vlees & Delicatessen',
  cheese: 'Kaas',
  dairy: 'Zuivel',
  pastaRiceSauces: 'Pasta, Rijst & Sauzen',
  breakfastSnacks: 'Ontbijt & Snacks',
  nonfoodPromotions: 'Aanbiedingen',
  beverages: 'Dranken',
  frozenFoods: 'Diepvries',
  checkout: 'Kassa',
} as const;

export type TranslationKey = keyof typeof translations;
