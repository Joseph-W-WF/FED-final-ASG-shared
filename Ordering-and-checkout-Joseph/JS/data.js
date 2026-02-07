window.FED = window.FED || {};

FED.data = (() => {
  // =========================================================
  // data.js (Customer seed data)
  // Edit these stalls/menu items/prices to match your design.
  // =========================================================

const ECO_BYOB = {
  id: "a_byob",
  name: "Eco-friendly takeaway (Bring your own box)",
  price: 0.00,
};

  const STALLS = [
    {
      id: "stall_1",
      name: "Clemens Kitchen",
      cuisines: ["Chinese", "Malay"],
      hygiene: "A",
      menu: [
        {
          id: "m_ck_1",
          name: "Chicken Rice",
          price: 5.50,
          tags: ["Chinese"],
          addons: [
            { id: "a_pack", name: "Packaging", price: 0.30 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
            { id: "a_chili", name: "Extra chili", price: 0.00 },
          ],
        },
        {
          id: "m_ck_2",
          name: "Fish Soup",
          price: 4.50,
          tags: ["Chinese"],
          addons: [{ id: "a_take", name: "Takeaway", price: 0.50 }],
        },
        {
          id: "m_ck_3",
          name: "Mushroom Soup",
          price: 4.50,
          tags: ["Western"],
          addons: [{ id: "a_take", name: "Takeaway", price: 0.50 }],
        },
        {
          id: "m_ck_4",
          name: "Chicken Rice Set",
          price: 8.80,
          tags: ["Chinese"],
          addons: [
            { id: "a_pack", name: "Packaging", price: 0.30 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
      ],
    },

    {
      id: "stall_2",
      name: "Indian Corner",
      cuisines: ["Indian", "Halal"],
      hygiene: "B",
      menu: [
        {
          id: "m_ic_1",
          name: "Prata",
          price: 2.60,
          tags: ["Indian", "Halal"],
          addons: [
            { id: "a_egg", name: "Add egg", price: 0.80 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
        {
          id: "m_ic_2",
          name: "Teh Tarik",
          price: 1.80,
          tags: ["Drinks"],
          addons: [
            { id: "a_less", name: "Less sugar", price: 0.00 },
            { id: "a_bigger", name: "Upsize", price: 0.70 },
          ],
        },
      ],
    },

    {
      id: "stall_3",
      name: "Pasta Place",
      cuisines: ["Western"],
      hygiene: "A",
      menu: [
        {
          id: "m_pp_1",
          name: "Carbonara",
          price: 6.50,
          tags: ["Western"],
          addons: [
            { id: "a_cheese", name: "Extra cheese", price: 0.80 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
        {
          id: "m_pp_2",
          name: "Aglio Olio",
          price: 6.00,
          tags: ["Western"],
          addons: [
            { id: "a_cheese", name: "Extra cheese", price: 0.80 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
      ],
    },

    {
      id: "stall_4",
      name: "Malay Delights",
      cuisines: ["Malay", "Halal"],
      hygiene: "A",
      menu: [
        {
          id: "m_md_1",
          name: "Nasi Lemak",
          price: 5.00,
          tags: ["Malay", "Halal"],
          addons: [
            { id: "a_sambal", name: "Extra sambal", price: 0.50 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
        {
          id: "m_md_2",
          name: "Mee Rebus",
          price: 4.80,
          tags: ["Malay", "Halal"],
          addons: [{ id: "a_take", name: "Takeaway", price: 0.50 }],
        },
      ],
    },

    {
      id: "stall_5",
      name: "Peranakan Kitchen",
      cuisines: ["Peranakan"],
      hygiene: "B",
      menu: [
        {
          id: "m_pk_1",
          name: "Laksa",
          price: 5.50,
          tags: ["Peranakan"],
          addons: [
            { id: "a_egg", name: "Add egg", price: 0.80 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
        {
          id: "m_pk_2",
          name: "Ondeh Ondeh (3pcs)",
          price: 2.50,
          tags: ["Dessert"],
          addons: [{ id: "a_take", name: "Takeaway", price: 0.50 }],
        },
      ],
    },
  ];
// Auto-add BYOB option to items that already have takeaway/packaging
for (const stall of STALLS) {
  for (const item of stall.menu) {
    item.addons = item.addons || [];

    const hasTakeawayOrPack = item.addons.some(
      a => a.id === "a_take" || a.id === "a_pack"
    );

    const alreadyHasBYOB = item.addons.some(a => a.id === "a_byob");

    if (hasTakeawayOrPack && !alreadyHasBYOB) {
      // Put it right after takeaway if possible, else add at the end
      const idxTake = item.addons.findIndex(a => a.id === "a_take");
      const insertAt = idxTake >= 0 ? idxTake + 1 : item.addons.length;
      item.addons.splice(insertAt, 0, { ...ECO_BYOB });
    }
  }
}

  return { STALLS };
})();
