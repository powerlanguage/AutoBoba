/*

Super hacky script to select items and their modifiers from restraunts on caviar

You probably shouldn't use this.
*/

const HEADER_HEIGHT = 132;
// Don't select a base item outside this range
const MIN_BASE_ITEM_PRICE = 4;
const MAX_BASE_ITEM_PRICE = 7;
const UNAVAILABLE_ITEM_LABELS = ["SOLD OUT", "AVAILABLE LATER"];

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function formatPrice(num) {
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// Selects an available item within the provided price range
async function chooseItem() {
  // Helper Functions
  function getMerchantMenuCategories() {
    return document.getElementsByClassName("merchant-menu-category");
  }

  function getItemListFromCategory(category) {
    // children accesses HTML collection returned by selector
    return category.querySelector("ul").children;
  }

  function getListItemPrice(item) {
    const price = item.getElementsByClassName("offer-tile_price")[0];
    // remove the dollar sign and convert to int
    if (price) {
      return parseInt(price.innerText.slice(1));
    }
    return price;
  }

  function getListItemName(item) {
    return item.getElementsByClassName("offer-tile_name")[0].innerText;
  }

  function isListItemAvailable(item) {
    return UNAVAILABLE_ITEM_LABELS.every(
      label => !item.innerText.includes(label)
    );
  }

  function isListItemInBasePriceRange(item) {
    const price = getListItemPrice(item);
    return price > MIN_BASE_ITEM_PRICE && price < MAX_BASE_ITEM_PRICE;
  }

  // Filters an itemList to a new list based on price and availability
  function filterItemListToEligibleItems(itemList) {
    return Array.from(itemList).filter(item => {
      const isAvailable = isListItemAvailable(item);
      const isBasePriceInRange = isListItemInBasePriceRange(item);
      return isAvailable && isBasePriceInRange;
    });
  }

  function mergeItemsFromCategories(categories) {
    return Array.from(categories).reduce((acc, category) => {
      return [...acc, ...getItemListFromCategory(category)];
    }, []);
  }

  // Do the work to select an item
  const categories = getMerchantMenuCategories();
  const allItems = mergeItemsFromCategories(categories);
  const eligibleItems = filterItemListToEligibleItems(allItems);
  const randomItem = randomChoice(eligibleItems);
  const name = getListItemName(randomItem);
  const price = formatPrice(getListItemPrice(randomItem));
  console.log(`Selecting: ${name} for ${price}`);
  window.scroll({
    left: 0,
    top: randomItem.offsetTop - HEADER_HEIGHT,
    behavior: "smooth"
  });
  await wait(2000);
  randomItem.querySelector("a").click();
}

// Items have modifiers and each modifier has options
// E.g.
// Modifier: Sweetness level
// Options: 0%, 50%, 100%
async function chooseOptions() {
  // Helper functions
  function getItemModifiers() {
    return document.getElementsByClassName("item_modifier");
  }

  function getModifierTitle(modifier) {
    return (
      modifier.getElementsByClassName("item_form-label_text")[0].innerText || ""
    );
  }

  function getPriceTotal() {
    return document
      .querySelector(".item_price-text")
      .getAttribute("data-adjusted-base-price");
  }

  // Shitty random number weighting
  function getRandomNumOptions() {
    const rand = Math.random();
    if (rand <= 0.35) {
      return 0;
    } else if (rand <= 0.7) {
      return 1;
    } else if (rand <= 0.9) {
      return 2;
    } else {
      return 3;
    }
  }

  async function selectModifierOptions(modifier) {
    // Get min and max options required for this modifier
    const max = parseInt(modifier.getAttribute("data-max-select"));
    const min = parseInt(modifier.getAttribute("data-min-select"));

    const numOptions = min === max ? min : getRandomNumOptions();

    console.log(
      `Selecting ${numOptions} for ${getModifierTitle(modifier)} from between ${min} and ${max}`
    );

    if (numOptions > 0) {
      modifier.scrollIntoView({ behavior: "smooth" });
      await wait(2000);
      const options = modifier.getElementsByTagName("input");
      for (let i = 0; i < numOptions; i++) {
        const currentPriceTotal = getPriceTotal();
        const choice = randomChoice(options);
        console.log(`Choosing: ${choice.nextElementSibling.innerText}`);
        choice.click();
        const newPriceTotal = getPriceTotal();
        if (newPriceTotal !== currentPriceTotal) {
          console.log(`Total price is now: ${formatPrice(getPriceTotal())}`);
        }
        await wait(1000);
      }
    }
  }

  // Do the work
  const modifiers = getItemModifiers();
  for (const modifier of modifiers) {
    await selectModifierOptions(modifier);
  }
}

function clickAddToCart() {
  console.log('Adding to cart...');
  const addToCardButton = document.getElementsByClassName("js-order-button")[0];
  addToCardButton.scrollIntoView({ behavior: "smooth" });
  addToCardButton.click();
}

async function autoBoba() {
  await chooseItem();
  // Modal loads to select options/modifiers
  await wait(2000);
  await chooseOptions();
  await wait(1000);
  clickAddToCart();
}

