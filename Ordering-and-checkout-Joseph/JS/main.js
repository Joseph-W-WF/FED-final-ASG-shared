window.FED = window.FED || {};

(() => {
  function init() {
    console.log("FED Hawker app initialising...");
    FED.cart.updateBadge();

    FED.profile.init();
    FED.pages.browse.init();
    FED.pages.menu.init();      
    FED.pages.cart.init();
    FED.checkout.init();
    FED.pages.orders.init();


    FED.router.init();
  }

  init();
})();
