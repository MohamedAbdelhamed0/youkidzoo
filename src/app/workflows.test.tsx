// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
  within,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "i18next";
import App from "./App";
import { useCartController } from "../features/cart/controllers/useCartController";
import {
  authRepository,
  useAuthController,
} from "../features/auth/controllers/useAuthController";
import { container } from "./di/container";
import type { User } from "../features/auth/domain/auth";
const customer: User = {
  id: "40000000-0000-4000-8000-000000000001",
  username: "test_parent",
  email: "parent@test.example",
  fullName: "Test Parent",
  phone: "",
  avatarUrl: null,
  role: "user",
  preferredLanguage: "en",
  isActive: true,
  createdAt: "2026-11-07",
};
beforeEach(async () => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  useCartController.setState({ cart: {}, wishes: [] });
  useAuthController.setState({ user: null, loading: true, error: "" });
  vi.spyOn(authRepository, "currentUser").mockResolvedValue(null);
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("takes shoppers from the landing clothing button to the clothing collection", async () => {
  const scroll = vi.fn();
  vi.stubGlobal("scrollTo", vi.fn());
  const original = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = scroll;
  try {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Everyday Cotton T-Shirt" });
    await user.click(
      screen.getByRole("button", { name: "Explore kids clothing" }),
    );
    expect(screen.getByRole("heading", { name: "Kids Clothing" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Little Explorer Airplane" }),
    ).toBeNull();
    expect(scroll).toHaveBeenCalled();
    expect(
      screen
        .getByRole("link", { name: "Shop the offers" })
        .getAttribute("href"),
    ).toBe("/shop?deals=true");
  } finally {
    Element.prototype.scrollIntoView = original;
    vi.unstubAllGlobals();
  }
});
it("loads reference storefront categories, searches the real catalog, and adds to the bag", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(
    await screen.findByRole("heading", {
      name: "Little things. Big smiles.",
    }),
  ).toBeTruthy();
  expect(
    (await screen.findAllByRole("button", { name: /Babies/ })).length,
  ).toBeGreaterThan(0);
  await user.type(
    screen.getByRole("textbox", { name: "Search products" }),
    "Airplane",
  );
  await user.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("heading", { name: "Find their next favorite" });
  await screen.findByRole("heading", { name: "Little Explorer Airplane" });
  expect(
    screen.queryByRole("heading", { name: "Cuddly Bunny Friend" }),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "Add +" }));
  expect(Object.values(useCartController.getState().cart)).toEqual([1]);
  await user.click(screen.getByRole("link", { name: "Bag (1)" }));
  expect(
    await screen.findByRole("heading", { name: "Your little bag" }),
  ).toBeTruthy();
  expect(
    await screen.findByRole("spinbutton", { name: "Quantity" }),
  ).toBeTruthy();
});
it("keeps checkout behind sign-in and returns the customer to checkout after login", async () => {
  const user = userEvent.setup();
  useCartController.getState().add("10000000-0000-4000-8000-000000000001");
  window.history.replaceState({}, "", "/checkout");
  render(<App />);
  await screen.findByRole("heading", { name: "Welcome back" });
  vi.spyOn(authRepository, "signIn").mockResolvedValue(customer);
  vi.mocked(authRepository.currentUser).mockResolvedValue(customer);
  await user.type(
    screen.getByRole("textbox", { name: "Email or username" }),
    "test_parent",
  );
  await user.type(screen.getByLabelText("Password"), "test-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(
    await screen.findByRole("heading", { name: "A little joy, on its way" }),
  ).toBeTruthy();
  expect(screen.getByRole("radio", { name: "Cash on delivery" })).toBeTruthy();
  expect(window.location.pathname).toBe("/checkout");
});
it("shows a real checkout error and preserves the bag for retry", async () => {
  const user = userEvent.setup();
  vi.mocked(authRepository.currentUser).mockResolvedValue(customer);
  vi.spyOn(container.orderRepository, "place").mockRejectedValue({
    message: "Not enough stock for Test toy.",
  });
  useCartController.getState().add("10000000-0000-4000-8000-000000000001");
  window.history.replaceState({}, "", "/checkout");
  render(<App />);
  await screen.findByRole("heading", { name: "Shipping details" });
  for (const [label, value] of [
    ["Recipient name", "Test Parent"],
    ["Phone", "01234567890"],
    ["City", "Cairo"],
    ["Street address", "123 Test Street"],
  ])
    await user.type(screen.getByRole("textbox", { name: label }), value);
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Place order" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  await user.click(screen.getByRole("button", { name: "Place order" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Not enough stock for Test toy.",
  );
  expect(Object.keys(useCartController.getState().cart)).toHaveLength(1);
});
it("restricts the admin dashboard for customers", async () => {
  vi.mocked(authRepository.currentUser).mockResolvedValue(customer);
  window.history.replaceState({}, "", "/admin");
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Access restricted" }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("heading", { name: "A little overview" }),
  ).toBeNull();
});
it("lets administrators create a shop through the validated editor", async () => {
  const user = userEvent.setup();
  vi.mocked(authRepository.currentUser).mockResolvedValue({
    ...customer,
    role: "admin",
  });
  vi.spyOn(container.adminRepository, "list").mockResolvedValue([]);
  vi.spyOn(container.adminRepository, "searchUsers").mockResolvedValue([
    {
      id: customer.id,
      username: customer.username,
      full_name: customer.fullName,
      email: customer.email,
    },
  ]);
  const save = vi
    .spyOn(container.adminRepository, "saveShop")
    .mockResolvedValue();
  window.history.replaceState({}, "", "/admin/shops");
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Add new +" }));
  const dialog = screen.getByRole("dialog");
  await user.click(
    await within(dialog).findByRole("checkbox", { name: /Test Parent/ }),
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "Name (English)" }),
    "Test Shop",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "Name (Arabic)" }),
    "متجر تجريبي",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "URL slug" }),
    "test-shop",
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Save changes" }),
  );
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        name_en: "Test Shop",
        name_ar: "متجر تجريبي",
        slug: "test-shop",
        is_active: true,
      }),
      [customer.id],
      undefined,
    ),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("switches language and document direction together", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "العربية" }));
  await screen.findByRole("heading", {
    name: "كل حاجة صغيرة، وراها ضحكة كبيرة.",
  });
  expect(document.documentElement.dir).toBe("rtl");
  expect(document.documentElement.lang).toBe("ar");
  expect(localStorage.getItem("ykz-language")).toBe("ar");
});
it("places a COD order, clears the bag, and shows its payment status in history", async () => {
  const user = userEvent.setup();
  vi.mocked(authRepository.currentUser).mockResolvedValue(customer);
  const order = {
    id: "50000000-0000-4000-8000-000000000001",
    orderNumber: "YKZ-TEST-0001",
    userId: customer.id,
    items: [
      {
        id: "line",
        productId: "10000000-0000-4000-8000-000000000001",
        shopId: null,
        productName: {
          en: "Little Explorer Airplane",
          ar: "طائرة المستكشف الصغير",
        },
        photo: "",
        unitPrice: 25,
        quantity: 1,
        subtotal: 25,
      },
    ],
    subtotal: 25,
    shippingFee: 7,
    discount: 0,
    total: 32,
    status: "pending" as const,
    shippingAddress: {
      recipientName: "Test Parent",
      phone: "01234567890",
      country: "Egypt",
      city: "Cairo",
      streetAddress: "123 Test Street",
    },
    notes: "",
    createdAt: "2026-11-07T00:00:00Z",
    updatedAt: "2026-11-07T00:00:00Z",
    payments: [
      {
        id: "payment",
        orderId: "50000000-0000-4000-8000-000000000001",
        userId: customer.id,
        amount: 32,
        currency: "EGP",
        method: "cash_on_delivery" as const,
        status: "pending" as const,
        providerTransactionId: null,
        paidAt: null,
        createdAt: "2026-11-07T00:00:00Z",
      },
    ],
  };
  const place = vi
    .spyOn(container.orderRepository, "place")
    .mockResolvedValue(order);
  vi.spyOn(container.orderRepository, "list").mockResolvedValue([order]);
  useCartController.getState().add(order.items[0].productId!);
  window.history.replaceState({}, "", "/checkout");
  render(<App />);
  await screen.findByRole("heading", { name: "Shipping details" });
  for (const [label, value] of [
    ["Recipient name", "Test Parent"],
    ["Phone", "01234567890"],
    ["City", "Cairo"],
    ["Street address", "123 Test Street"],
  ])
    await user.type(screen.getByRole("textbox", { name: label }), value);
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Place order" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  await user.click(screen.getByRole("button", { name: "Place order" }));
  expect(
    await screen.findByRole("heading", { name: "YKZ-TEST-0001" }),
  ).toBeTruthy();
  expect(screen.getByText("Cash on delivery · Pending")).toBeTruthy();
  expect(useCartController.getState().cart).toEqual({});
  expect(sessionStorage.getItem(`ykz-checkout-${customer.id}`)).toBeNull();
  expect(place).toHaveBeenCalledWith(
    expect.objectContaining({
      items: [{ productId: order.items[0].productId, quantity: 1 }],
      requestId: expect.any(String),
    }),
  );
});
it("does not show all products for an unknown shop URL", async () => {
  window.history.replaceState({}, "", "/shops/does-not-exist");
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Page not found" }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("heading", { name: "Little Explorer Airplane" }),
  ).toBeNull();
});
it("allows Escape to close the admin editor and returns focus to its trigger", async () => {
  const user = userEvent.setup();
  vi.mocked(authRepository.currentUser).mockResolvedValue({
    ...customer,
    role: "admin",
  });
  vi.spyOn(container.adminRepository, "list").mockResolvedValue([]);
  window.history.replaceState({}, "", "/admin/shops");
  render(<App />);
  const trigger = await screen.findByRole("button", { name: "Add new +" });
  await user.click(trigger);
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(document.body.style.overflow).toBe("hidden");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(document.body.style.overflow).not.toBe("hidden");
});
it("shows an Arabic service error when sign-in has no configured backend", async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, "", "/login");
  render(<App />);
  await user.click(screen.getByRole("button", { name: "العربية" }));
  await screen.findByRole("heading", { name: "مرحبًا بعودتك" });
  await user.type(
    screen.getByRole("textbox", { name: "البريد الإلكتروني أو اسم المستخدم" }),
    "test_parent",
  );
  await user.type(screen.getByLabelText("كلمة المرور"), "test-password");
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "المتجر غير متصل حاليًا. يرجى المحاولة بعد تفعيل الخدمة.",
  );
});

it("shows an empty owner workspace and keeps admin routes restricted", async () => {
  vi.mocked(authRepository.currentUser).mockResolvedValue({
    ...customer,
    role: "shop_owner",
  });
  vi.spyOn(container.adminRepository, "ownerRecords").mockResolvedValue([]);
  const adminList = vi.spyOn(container.adminRepository, "list");
  window.history.replaceState({}, "", "/owner/products");
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByText(/No shops assigned yet/)).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "Add new +" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(adminList).not.toHaveBeenCalled();
  expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
  await user.click(screen.getByRole("link", { name: "My shop products" }));
  cleanup();
  window.history.replaceState({}, "", "/admin/products");
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Access restricted" }),
  ).toBeTruthy();
});
it("loads assigned products and filters category choices for the selected shop", async () => {
  vi.mocked(authRepository.currentUser).mockResolvedValue({
    ...customer,
    role: "shop_owner",
  });
  const shop = "20000000-0000-4000-8000-000000000001";
  vi.spyOn(container.adminRepository, "ownerRecords").mockImplementation(
    async (resource) =>
      resource === "shops"
        ? [{ id: shop, name_en: "Assigned shoes", name_ar: "Assigned shoes" }]
        : resource === "categories"
          ? [
              {
                id: "30000000-0000-4000-8000-000000000001",
                name_en: "Adopted global",
                is_active: true,
                shop_id: null,
              },
              {
                id: "30000000-0000-4000-8000-000000000002",
                name_en: "Unadopted global",
                is_active: true,
                shop_id: null,
              },
              {
                id: "30000000-0000-4000-8000-000000000003",
                name_en: "Shop category",
                is_active: true,
                shop_id: shop,
              },
              {
                id: "30000000-0000-4000-8000-000000000004",
                name_en: "Inactive category",
                is_active: false,
                shop_id: shop,
              },
            ]
          : [],
  );
  vi.spyOn(container.adminRepository, "shopCategories").mockResolvedValue([
    "30000000-0000-4000-8000-000000000001",
  ]);
  window.history.replaceState({}, "", "/owner/products");
  render(<App />);
  const user = userEvent.setup();
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Add new +" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  await user.click(screen.getByRole("button", { name: "Add new +" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(
    await dialog.findByRole("option", { name: "Adopted global" }),
  ).toBeTruthy();
  expect(dialog.getByRole("option", { name: "Shop category" })).toBeTruthy();
  expect(dialog.queryByRole("option", { name: "Unadopted global" })).toBeNull();
  expect(
    dialog.queryByRole("option", { name: "Inactive category" }),
  ).toBeNull();
  expect(dialog.getByRole("option", { name: "Assigned shoes" })).toBeTruthy();
});

it("lets an owner create and delete products through the assigned-shop editor", async () => {
  vi.mocked(authRepository.currentUser).mockResolvedValue({
    ...customer,
    role: "shop_owner",
  });
  const shop = "20000000-0000-4000-8000-000000000001",
    category = "30000000-0000-4000-8000-000000000001";
  vi.spyOn(container.adminRepository, "ownerRecords").mockImplementation(
    async (resource) =>
      resource === "shops"
        ? [{ id: shop, name_en: "Assigned", name_ar: "Assigned" }]
        : resource === "categories"
          ? [
              {
                id: category,
                name_en: "Shoes",
                name_ar: "Shoes",
                is_active: true,
                shop_id: shop,
              },
            ]
          : [
              {
                id: "product",
                name_en: "Hidden shoes",
                name_ar: "Hidden shoes",
                is_active: false,
              },
            ],
  );
  vi.spyOn(container.adminRepository, "shopCategories").mockResolvedValue([]);
  const save = vi
    .spyOn(container.adminRepository, "saveOwnerProduct")
    .mockResolvedValue();
  const remove = vi
    .spyOn(container.adminRepository, "removeOwnerProduct")
    .mockResolvedValue();
  window.history.replaceState({}, "", "/owner/products");
  render(<App />);
  const user = userEvent.setup();
  await screen.findByText("Hidden shoes");
  await user.click(screen.getByRole("button", { name: "Add new +" }));
  const dialog = within(screen.getByRole("dialog"));
  await user.type(
    dialog.getByRole("textbox", { name: "Name (English)" }),
    "New shoes",
  );
  await user.type(
    dialog.getByRole("textbox", { name: "Name (Arabic)" }),
    "New shoes Arabic",
  );
  await user.type(dialog.getByRole("textbox", { name: "SKU" }), "OWNER-NEW");
  await user.selectOptions(
    dialog.getByRole("combobox", { name: "Category" }),
    category,
  );
  await user.click(dialog.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        shop_id: shop,
        category_id: category,
        sku: "OWNER-NEW",
      }),
      undefined,
    ),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(
    within(screen.getByRole("alertdialog")).getByRole("button", {
      name: "Delete permanently",
    }),
  );
  await waitFor(() => expect(remove).toHaveBeenCalledWith("product"));
});
