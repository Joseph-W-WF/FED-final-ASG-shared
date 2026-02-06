window.FED = window.FED || {};

FED.data = (() => {
  const STALLS = [
    {
      id: "stall_1",
      name: "Ali Bing Chicken Rice",
      cuisines: ["Chinese", "Halal"],
      hygiene: "A",
      menu: [
        {
          id: "m1",
          name: "Chicken Rice (Roasted)",
          price: 4.50,
          tags: ["Chinese"],
          addons: [
            { id: "a_pack", name: "Packaging", price: 0.30 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
            { id: "a_chili", name: "Extra chili", price: 0.00 },
          ],
        },
        {
          id: "m2",
          name: "Chicken Rice (Steamed)",
          price: 4.50,
          tags: ["Chinese"],
          addons: [
            { id: "a_pack", name: "Packaging", price: 0.30 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
        {
          id: "m3",
          name: "Iced Milo",
          price: 2.00,
          tags: ["Drinks"],
          addons: [
            { id: "a_less", name: "Less ice", price: 0.00 },
            { id: "a_bigger", name: "Upsize", price: 0.80 },
          ],
        },
      ],
    },
    {
      id: "stall_2",
      name: "Ah Boy Char Kway Teow",
      cuisines: ["Chinese"],
      hygiene: "B",
      menu: [
        {
          id: "m4",
          name: "Char Kway Teow",
          price: 5.00,
          tags: ["Chinese"],
          addons: [
            { id: "a_egg", name: "Add egg", price: 0.80 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
        {
          id: "m5",
          name: "Fried Carrot Cake (White)",
          price: 3.50,
          tags: ["Chinese"],
          addons: [{ id: "a_take", name: "Takeaway", price: 0.50 }],
        },
      ],
    },
    {
      id: "stall_3",
      name: "Siti Nasi Padang",
      cuisines: ["Malay", "Halal"],
      hygiene: "A",
      menu: [
        {
          id: "m6",
          name: "Nasi Padang (Chicken)",
          price: 6.00,
          tags: ["Malay", "Halal"],
          addons: [
            { id: "a_sambal", name: "Extra sambal", price: 0.50 },
            { id: "a_take", name: "Takeaway", price: 0.50 },
          ],
        },
        {
          id: "m7",
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
  ];

  return { STALLS };
})();
