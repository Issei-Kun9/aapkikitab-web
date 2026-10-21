/* Content types for the AapkiKitab admin panel and API. Generated from the Shopify setup the
   client used before (same names, help text and field order), plus Product and Policy page. */

export type FieldType =
  | "text" | "multiline" | "number" | "boolean" | "url" | "date" | "datetime" | "json"
  | "choice" | "list.choice" | "list.text" | "file" | "list.file" | "product" | "ref" | "list.ref";

export interface FieldDef {
  key: string;
  name: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  choices?: string[];
  ref?: string; // content type a ref points at
  media?: "image" | "image+video";
  min?: number;
  max?: number;
  hidden?: boolean; // used by the website only, never shown in admin
  readonly?: boolean;
}

export interface ContentType {
  type: string;
  name: string;
  help: string;
  group: "Shop" | "Homepage" | "Menus" | "Community" | "Settings";
  displayKey: string | null;
  publishable: boolean; // has Active / Draft status
  single: boolean; // exactly one entry (e.g. Homepage settings)
  public: boolean; // readable by the website build
  fields: FieldDef[];
}

export const TYPES: ContentType[] = [
  {
    "type": "product",
    "name": "Product",
    "group": "Shop",
    "publishable": true,
    "single": false,
    "public": true,
    "displayKey": "title",
    "help": "Books and art & craft items. Choose Live to sell it on the website, or Hidden to keep it off the shop. Changes show on the website within 15 minutes.",
    "fields": [
      {
        "key": "title",
        "name": "Title",
        "type": "text",
        "required": true,
        "help": "The name customers see, e.g. Atomic Habits."
      },
      {
        "key": "kind",
        "name": "Type",
        "type": "choice",
        "choices": [
          "Book",
          "Art & Craft"
        ],
        "required": true,
        "help": "Art & Craft items appear on the Art & Craft page."
      },
      {
        "key": "author",
        "name": "Author / brand",
        "type": "text",
        "help": "For books, the author. For art & craft, the brand (or leave empty)."
      },
      {
        "key": "images",
        "name": "Photos",
        "type": "list.file",
        "media": "image",
        "help": "The first photo is the cover. Add clear, bright photos."
      },
      {
        "key": "price",
        "name": "Price (₹)",
        "type": "number",
        "required": true,
        "min": 1,
        "help": "What the customer pays."
      },
      {
        "key": "mrp",
        "name": "MRP / compare-at price (₹)",
        "type": "number",
        "help": "The printed price. If higher than Price, it shows crossed out with a % OFF sticker. Leave empty for no discount."
      },
      {
        "key": "stock",
        "name": "Stock left",
        "type": "number",
        "help": "Leave empty if you always have it. At 0 the item shows as Sold out and cannot be bought."
      },
      {
        "key": "description",
        "name": "Description",
        "type": "multiline",
        "help": "2–3 lines about the item. Shown on the product page."
      },
      {
        "key": "isbn",
        "name": "ISBN",
        "type": "text",
        "help": "The number on the back of the book (customers can search by it)."
      },
      {
        "key": "publisher",
        "name": "Publisher",
        "type": "text"
      },
      {
        "key": "pages",
        "name": "Pages",
        "type": "number"
      },
      {
        "key": "language",
        "name": "Language",
        "type": "text"
      },
      {
        "key": "edition",
        "name": "Edition",
        "type": "text"
      },
      {
        "key": "genre",
        "name": "Genre",
        "type": "text"
      },
      {
        "key": "shelves",
        "name": "Shows under (category, mood, exam, art & craft type)",
        "type": "list.ref",
        "help": "Pick every tile this product should appear under on the website. Tiles are managed in Content → Metaobjects → Discovery tile.",
        "ref": "ak_tile"
      },
      {
        "key": "bookstore",
        "name": "Bookstore",
        "type": "ref",
        "help": "The partner bookshop this product comes from. Shops are managed in Content → Metaobjects → Partner bookstore.",
        "ref": "ak_bookstore"
      },
      {
        "key": "highlights",
        "name": "Highlight on the website",
        "type": "list.choice",
        "help": "New arrival → New Arrivals row. Bestseller / Trending → Best Selling row. Book of the day → today’s book (pick one product). Featured → badge.",
        "choices": [
          "New arrival",
          "Bestseller",
          "Trending",
          "Featured",
          "Book of the day"
        ]
      }
    ]
  },
  {
    "type": "ak_promo_slide",
    "name": "Homepage slide",
    "help": "Extra banner slides on the homepage (shown when \"Show extra banner slides\" is on in Homepage settings). Changes show on the website within 30 minutes.",
    "displayKey": "heading",
    "group": "Homepage",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "heading",
        "name": "Heading",
        "required": true,
        "type": "text"
      },
      {
        "key": "lead",
        "name": "Line above book title",
        "type": "text"
      },
      {
        "key": "book",
        "name": "Book",
        "help": "The book the slide links to.",
        "required": true,
        "type": "product"
      },
      {
        "key": "note",
        "name": "Line under book title",
        "type": "text"
      },
      {
        "key": "button_text",
        "name": "Button text",
        "type": "text"
      },
      {
        "key": "photo",
        "name": "Background photo",
        "help": "Wide background photo.",
        "required": true,
        "type": "file",
        "media": "image"
      },
      {
        "key": "start_date",
        "name": "Start showing on",
        "help": "Optional: first day to show the slide.",
        "type": "date"
      },
      {
        "key": "end_date",
        "name": "Stop showing after",
        "help": "Optional: last day to show the slide (good for sales).",
        "type": "date"
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_tile",
    "name": "Discovery tile (category / mood / exam / art & craft type)",
    "help": "Tiles for Categories, Moods, Exams and Art & Craft types. To put a product under a tile, open the product and pick the tile in \"Shows under\". Changes show on the website within 30 minutes.",
    "displayKey": "label",
    "group": "Shop",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "label",
        "name": "Name",
        "required": true,
        "type": "text"
      },
      {
        "key": "subtitle",
        "name": "Small line under name",
        "type": "text"
      },
      {
        "key": "kind",
        "name": "Section",
        "help": "Which section the tile belongs to.",
        "required": true,
        "type": "choice",
        "choices": [
          "Category",
          "Mood",
          "Exam",
          "Art & Craft type"
        ]
      },
      {
        "key": "tag",
        "name": "Short code",
        "help": "Short code used in the page address, e.g. self-help → /category/self-help. Lowercase with dashes. Do not change it once in use.",
        "required": true,
        "type": "text"
      },
      {
        "key": "image",
        "name": "Image",
        "help": "Optional photo for the tile.",
        "type": "file",
        "media": "image"
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_budget",
    "name": "Budget range",
    "help": "\"Books under ₹…\" ranges on the homepage. Changes show on the website within 30 minutes.",
    "displayKey": "label",
    "group": "Homepage",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "label",
        "name": "Label",
        "required": true,
        "type": "text"
      },
      {
        "key": "max_price",
        "name": "Maximum price (₹)",
        "help": "Products at or below this price are shown.",
        "required": true,
        "type": "number"
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_gift_box",
    "name": "Gift box",
    "help": "Gift boxes on the homepage. Changes show on the website within 30 minutes.",
    "displayKey": "name",
    "group": "Homepage",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "name",
        "name": "Name",
        "required": true,
        "type": "text"
      },
      {
        "key": "contents",
        "name": "What's inside",
        "help": "One item per line.",
        "type": "list.text"
      },
      {
        "key": "price",
        "name": "Price (₹)",
        "required": true,
        "type": "number"
      },
      {
        "key": "photo",
        "name": "Photo",
        "required": true,
        "type": "file",
        "media": "image"
      },
      {
        "key": "product",
        "name": "Product to buy (optional)",
        "help": "Optional: the product customers buy for this box.",
        "type": "product"
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_bookstore",
    "name": "Partner bookstore",
    "help": "Partner bookshops (Bookstores page). To list a product under a shop, open the product and pick the shop in \"Bookstore\". Changes show on the website within 30 minutes.",
    "displayKey": "name",
    "group": "Shop",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "name",
        "name": "Store name",
        "required": true,
        "type": "text"
      },
      {
        "key": "tag",
        "name": "Short code",
        "help": "Short code used in the page address, e.g. kitab-ghar → /store/kitab-ghar. Lowercase with dashes.",
        "required": true,
        "type": "text"
      },
      {
        "key": "location",
        "name": "Location",
        "required": true,
        "type": "text"
      },
      {
        "key": "about",
        "name": "About the store",
        "type": "multiline"
      },
      {
        "key": "phone",
        "name": "Phone",
        "help": "Shown on the shop page. Leave empty to hide.",
        "type": "text"
      },
      {
        "key": "photo",
        "name": "Store photo",
        "type": "file",
        "media": "image"
      },
      {
        "key": "verified",
        "name": "Verified",
        "type": "boolean"
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_homepage",
    "name": "Homepage settings",
    "help": "Main banner, top bar, header text and which homepage sections are shown. There is only one of these — edit it, do not add another. Changes show on the website within 30 minutes.",
    "displayKey": "announcement_1",
    "group": "Homepage",
    "publishable": false,
    "single": true,
    "public": true,
    "fields": [
      {
        "key": "header_tagline",
        "name": "Header: line under logo",
        "type": "text"
      },
      {
        "key": "search_placeholder",
        "name": "Header: search box hint",
        "type": "text"
      },
      {
        "key": "default_delivery_place",
        "name": "Header: default 'Deliver to' place",
        "type": "text"
      },
      {
        "key": "announcement_1",
        "name": "Top bar message 1 (leave all empty to hide the bar)",
        "type": "text"
      },
      {
        "key": "announcement_2",
        "name": "Top bar message 2",
        "type": "text"
      },
      {
        "key": "announcement_3",
        "name": "Top bar message 3",
        "type": "text"
      },
      {
        "key": "hero_eyebrow",
        "name": "Main banner: small top line (optional)",
        "type": "text"
      },
      {
        "key": "hero_title",
        "name": "Main banner: heading (use | for a new line)",
        "type": "text"
      },
      {
        "key": "hero_lines",
        "name": "Main banner: text under heading",
        "help": "Each line is shown on its own line.",
        "type": "multiline"
      },
      {
        "key": "hero_button_text",
        "name": "Main banner: button text",
        "type": "text"
      },
      {
        "key": "hero_button_link",
        "name": "Main banner: button link",
        "help": "A page on the site, e.g. /browse, /new, /offers.",
        "type": "text"
      },
      {
        "key": "hero_photo",
        "name": "Main banner: background photo",
        "type": "file",
        "media": "image"
      },
      {
        "key": "hero_book",
        "name": "Main banner: book shown (optional)",
        "help": "Optional: a book shown in the main banner.",
        "type": "product"
      },
      {
        "key": "new_arrivals_title",
        "name": "Heading: new arrivals row",
        "help": "Products with Highlight = New arrival appear in this row.",
        "type": "text"
      },
      {
        "key": "best_sellers_title",
        "name": "Heading: best sellers row",
        "help": "Products with Highlight = Bestseller or Trending appear in this row.",
        "type": "text"
      },
      {
        "key": "show_shortcuts",
        "name": "Show round shortcut buttons",
        "type": "boolean"
      },
      {
        "key": "show_trust_strip",
        "name": "Show trust strip (free delivery, returns…)",
        "type": "boolean"
      },
      {
        "key": "show_promo_tiles",
        "name": "Show promo cards",
        "type": "boolean"
      },
      {
        "key": "show_slider",
        "name": "Show extra banner slides",
        "type": "boolean"
      },
      {
        "key": "show_new_arrivals",
        "name": "Show new arrivals",
        "help": "Products with Highlight = New arrival.",
        "type": "boolean"
      },
      {
        "key": "show_trending",
        "name": "Show best sellers",
        "help": "Products with Highlight = Bestseller or Trending.",
        "type": "boolean"
      },
      {
        "key": "show_categories",
        "name": "Show categories",
        "type": "boolean"
      },
      {
        "key": "show_moods",
        "name": "Show moods",
        "type": "boolean"
      },
      {
        "key": "show_find_book",
        "name": "Show 'Find your next book'",
        "type": "boolean"
      },
      {
        "key": "show_exams",
        "name": "Show education & exams",
        "type": "boolean"
      },
      {
        "key": "show_budget",
        "name": "Show budget band",
        "type": "boolean"
      },
      {
        "key": "show_art_craft",
        "name": "Show art & craft",
        "help": "Products whose Product type is Art & Craft appear here.",
        "type": "boolean"
      },
      {
        "key": "show_gift_boxes",
        "name": "Show gift boxes",
        "type": "boolean"
      },
      {
        "key": "show_book_of_day",
        "name": "Show today's book",
        "help": "Set Highlight = Book of the day on one product.",
        "type": "boolean"
      },
      {
        "key": "show_reviews",
        "name": "Show reader reviews",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_shop_info",
    "name": "Shop details",
    "help": "Delivery, payment, contact, footer, social and Google settings. There is only one of these — edit it, do not add another. Changes show on the website within 30 minutes.",
    "displayKey": null,
    "group": "Settings",
    "publishable": false,
    "single": true,
    "public": true,
    "fields": [
      {
        "key": "delivery_headline",
        "name": "Delivery banner: main line",
        "type": "text"
      },
      {
        "key": "delivery_subline",
        "name": "Delivery banner: small line",
        "type": "text"
      },
      {
        "key": "dispatch_text",
        "name": "Shipping: delivery time text",
        "type": "text"
      },
      {
        "key": "free_shipping_above",
        "name": "Shipping: free on orders above (₹) — 0 = free on every order",
        "help": "Text on the site only. The real delivery charge is set in Settings → Shipping and delivery.",
        "type": "number"
      },
      {
        "key": "shipping_fee",
        "name": "Shipping: fee below that amount (₹) — 0 = always free",
        "type": "number"
      },
      {
        "key": "return_days",
        "name": "Returns: days allowed",
        "type": "number"
      },
      {
        "key": "online_payment_label",
        "name": "Payment: accepted method label",
        "type": "text"
      },
      {
        "key": "cod_available",
        "name": "Payment: Cash on Delivery available",
        "help": "Leave unticked: checkout is online payment only. Also keep Cash on Delivery off in Settings → Payments.",
        "type": "boolean"
      },
      {
        "key": "payment_methods",
        "name": "Footer: payment methods shown",
        "help": "One per line, e.g. UPI.",
        "type": "list.text"
      },
      {
        "key": "contact_phone",
        "name": "Contact: phone number",
        "type": "text"
      },
      {
        "key": "contact_whatsapp",
        "name": "Contact: WhatsApp number",
        "help": "With country code, e.g. +91 95092 01038. Chat and \"Request a book\" buttons open WhatsApp to this number.",
        "type": "text"
      },
      {
        "key": "contact_email",
        "name": "Contact: email",
        "help": "Shown on the site and used for messages when WhatsApp is not set.",
        "type": "text"
      },
      {
        "key": "contact_address",
        "name": "Contact: address",
        "type": "multiline"
      },
      {
        "key": "chat_status",
        "name": "Chat: status line under team name",
        "type": "text"
      },
      {
        "key": "footer_about",
        "name": "Footer: about the shop",
        "type": "multiline"
      },
      {
        "key": "newsletter_heading",
        "name": "Footer: newsletter heading",
        "type": "text"
      },
      {
        "key": "copyright_text",
        "name": "Footer: copyright line",
        "type": "text"
      },
      {
        "key": "instagram",
        "name": "Social: Instagram link",
        "type": "url"
      },
      {
        "key": "facebook",
        "name": "Social: Facebook link",
        "type": "url"
      },
      {
        "key": "youtube",
        "name": "Social: YouTube link",
        "type": "url"
      },
      {
        "key": "seo_title",
        "name": "Google: site title",
        "type": "text"
      },
      {
        "key": "seo_description",
        "name": "Google: site description",
        "type": "multiline"
      }
    ]
  },
  {
    "type": "ak_shortcut",
    "name": "Homepage shortcut button",
    "help": "Round shortcut buttons under the main banner. Changes show on the website within 30 minutes.",
    "displayKey": "label",
    "group": "Homepage",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "label",
        "name": "Label",
        "required": true,
        "type": "text"
      },
      {
        "key": "icon",
        "name": "Icon",
        "type": "choice",
        "choices": [
          "Books",
          "Gifts",
          "Art & Craft",
          "Stationery",
          "Exams",
          "Home",
          "Star"
        ]
      },
      {
        "key": "link",
        "name": "Link",
        "help": "A page on the site, e.g. /browse, /art-craft, /category/fiction.",
        "type": "text"
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_trust_item",
    "name": "Trust strip item",
    "help": "The 4 reassurance items (Free delivery, Secure payments…). Only the first 4 are shown. Changes show on the website within 30 minutes.",
    "displayKey": "title",
    "group": "Homepage",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "title",
        "name": "Title",
        "required": true,
        "type": "text"
      },
      {
        "key": "subtitle",
        "name": "Small line",
        "type": "text"
      },
      {
        "key": "icon",
        "name": "Icon",
        "type": "choice",
        "choices": [
          "Truck",
          "Shield",
          "Box",
          "Headset",
          "Store",
          "Star",
          "Check"
        ]
      },
      {
        "key": "link",
        "name": "Link (optional)",
        "type": "text"
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_promo_tile",
    "name": "Homepage promo card",
    "help": "Promo cards on the homepage. Changes show on the website within 30 minutes.",
    "displayKey": "title",
    "group": "Homepage",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "title",
        "name": "Title",
        "required": true,
        "type": "text"
      },
      {
        "key": "subtitle",
        "name": "Small line (optional)",
        "type": "text"
      },
      {
        "key": "button_text",
        "name": "Link text",
        "type": "text"
      },
      {
        "key": "link",
        "name": "Link",
        "help": "A page on the site, e.g. /trending or /offers.",
        "type": "text"
      },
      {
        "key": "photo",
        "name": "Photo",
        "type": "file",
        "media": "image"
      },
      {
        "key": "colour",
        "name": "Background colour",
        "type": "choice",
        "choices": [
          "Peach",
          "Lavender",
          "Mint",
          "Rose",
          "Sky"
        ]
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_link",
    "name": "Menu link",
    "help": "Links in the header menu and footer. Changes show on the website within 30 minutes.",
    "displayKey": "label",
    "group": "Menus",
    "publishable": false,
    "single": false,
    "public": true,
    "fields": [
      {
        "key": "label",
        "name": "Label",
        "required": true,
        "type": "text"
      },
      {
        "key": "link",
        "name": "Link",
        "help": "A page on the site (e.g. /browse, /new, /trending, /offers, /policies) or a full https:// link.",
        "required": true,
        "type": "text"
      },
      {
        "key": "placement",
        "name": "Where it appears",
        "help": "Header menu, or which footer column.",
        "required": true,
        "type": "choice",
        "choices": [
          "Header menu",
          "Footer – Shop",
          "Footer – Discover",
          "Footer – Help"
        ]
      },
      {
        "key": "position",
        "name": "Display order",
        "help": "Set with the ▲ ▼ buttons in the list.",
        "type": "number",
        "hidden": true
      },
      {
        "key": "active",
        "name": "Show on website",
        "help": "Untick to hide it from the website without deleting it.",
        "type": "boolean"
      }
    ]
  },
  {
    "type": "ak_post",
    "name": "Customer post",
    "help": "Customer reviews from the website. New reviews arrive as Draft — open one and set Status to Active to publish it, or delete it. Reviews appear on the site within a minute.",
    "displayKey": "author_name",
    "group": "Community",
    "publishable": true,
    "single": false,
    "public": false,
    "fields": [
      {
        "key": "author_name",
        "name": "Customer name",
        "type": "text"
      },
      {
        "key": "rating",
        "name": "Rating (1-5)",
        "type": "number",
        "min": 1,
        "max": 5
      },
      {
        "key": "text",
        "name": "Post",
        "type": "multiline"
      },
      {
        "key": "media",
        "name": "Photos / videos",
        "type": "list.file",
        "media": "image+video"
      },
      {
        "key": "book",
        "name": "Book (optional)",
        "type": "product"
      },
      {
        "key": "team_reply",
        "name": "Reply from AapkiKitab Team",
        "help": "Your public answer, shown under the review with the purple verified AapkiKitab Team badge.",
        "type": "multiline"
      },
      {
        "key": "featured",
        "name": "Pin to top",
        "help": "Tick to pin this review to the top.",
        "type": "boolean"
      },
      {
        "key": "verified_purchase",
        "name": "Verified purchase",
        "help": "Set automatically when the customer has ordered before.",
        "type": "boolean"
      },
      {
        "key": "likes",
        "name": "Likes",
        "type": "number"
      },
      {
        "key": "reply_likes",
        "name": "Likes on team reply",
        "type": "number"
      },
      {
        "key": "submitted_at",
        "name": "Submitted",
        "type": "datetime"
      },
      {
        "key": "reply_at",
        "name": "Team replied on",
        "type": "datetime"
      },
      {
        "key": "customer_email",
        "name": "Customer email (private)",
        "help": "Private — never shown on the website.",
        "type": "text"
      },
      {
        "key": "customer_id",
        "name": "Customer ID (private)",
        "type": "text",
        "hidden": true
      }
    ]
  },
  {
    "type": "ak_message",
    "name": "Customer message",
    "help": "Reported reviews and other messages from the website. Set Status to Resolved when handled.",
    "displayKey": "name",
    "group": "Community",
    "publishable": false,
    "single": false,
    "public": false,
    "fields": [
      {
        "key": "name",
        "name": "Name",
        "type": "text"
      },
      {
        "key": "contact",
        "name": "Phone / email",
        "type": "text"
      },
      {
        "key": "topic",
        "name": "Topic",
        "type": "text"
      },
      {
        "key": "message",
        "name": "Message",
        "type": "multiline"
      },
      {
        "key": "order",
        "name": "Order number",
        "type": "text"
      },
      {
        "key": "page",
        "name": "Sent from page",
        "type": "text"
      },
      {
        "key": "status",
        "name": "Status",
        "type": "choice",
        "choices": [
          "New",
          "In progress",
          "Resolved"
        ]
      },
      {
        "key": "received_at",
        "name": "Received",
        "type": "datetime"
      }
    ]
  },
  {
    "type": "ak_comment",
    "name": "Customer comment",
    "help": "Comments on reviews. New comments arrive as Draft — set Status to Active to publish them.",
    "displayKey": "author_name",
    "group": "Community",
    "publishable": true,
    "single": false,
    "public": false,
    "fields": [
      {
        "key": "author_name",
        "name": "Customer name",
        "type": "text"
      },
      {
        "key": "text",
        "name": "Comment",
        "type": "multiline"
      },
      {
        "key": "post",
        "name": "On post",
        "help": "The review this comment is on.",
        "type": "ref",
        "ref": "ak_post"
      },
      {
        "key": "likes",
        "name": "Likes",
        "type": "number"
      },
      {
        "key": "submitted_at",
        "name": "Submitted",
        "type": "datetime"
      },
      {
        "key": "customer_email",
        "name": "Customer email (private)",
        "help": "Private — never shown on the website.",
        "type": "text"
      },
      {
        "key": "customer_id",
        "name": "Customer ID (private)",
        "type": "text",
        "hidden": true
      }
    ]
  },
  {
    "type": "ak_chat",
    "name": "Support chat",
    "help": "Website chats. Type in \"Your reply\" and Save — it appears in the customer’s chat on the site. For urgent replies, also call/WhatsApp their number. Set Status to Resolved when done.",
    "displayKey": "name",
    "group": "Community",
    "publishable": false,
    "single": false,
    "public": false,
    "fields": [
      {
        "key": "name",
        "name": "Customer name",
        "type": "text"
      },
      {
        "key": "contact",
        "name": "Phone / email",
        "type": "text"
      },
      {
        "key": "status",
        "name": "Status",
        "type": "choice",
        "choices": [
          "New message",
          "Waiting for customer",
          "Resolved"
        ]
      },
      {
        "key": "conversation",
        "name": "Conversation",
        "help": "The full conversation so far (read only).",
        "type": "multiline",
        "readonly": true
      },
      {
        "key": "reply",
        "name": "Your reply (type here and save)",
        "help": "Type your answer here and click Save. The customer sees it the next time the website is open on their phone (the box then clears itself). If they do not come back, use the phone/email above.",
        "type": "multiline"
      },
      {
        "key": "last_message_at",
        "name": "Last message",
        "type": "datetime"
      },
      {
        "key": "customer_email",
        "name": "Customer email (private)",
        "type": "text"
      },
      {
        "key": "customer_id",
        "name": "Customer ID (private)",
        "type": "text",
        "hidden": true
      },
      {
        "key": "messages",
        "name": "Messages (data)",
        "help": "Used by the website — do not edit.",
        "type": "json",
        "hidden": true
      },
      {
        "key": "access_key",
        "name": "Access key (private)",
        "help": "Used by the website — do not edit.",
        "type": "text",
        "hidden": true
      }
    ]
  },
  {
    "type": "policy",
    "name": "Policy page",
    "group": "Settings",
    "publishable": false,
    "single": false,
    "public": true,
    "displayKey": "title",
    "help": "Shipping, returns & refunds, privacy and terms. Shown on the Policies page and needed by Razorpay. Write \"## \" at the start of a line for a heading and \"- \" for a bullet point.",
    "fields": [
      {
        "key": "title",
        "name": "Title",
        "type": "text",
        "required": true
      },
      {
        "key": "section",
        "name": "Which policy",
        "type": "choice",
        "required": true,
        "choices": [
          "Shipping",
          "Returns & refunds",
          "Privacy",
          "Terms"
        ],
        "help": "Each policy appears once on the Policies page."
      },
      {
        "key": "body",
        "name": "Text",
        "type": "multiline",
        "required": true,
        "help": "\"## \" = heading, \"- \" = bullet point. Leave an empty line between paragraphs."
      }
    ]
  }
];

export const typeOf = (type: string) => TYPES.find((t) => t.type === type);
