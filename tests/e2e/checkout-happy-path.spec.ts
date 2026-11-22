import { expect, test } from "@playwright/test";

test("Guest browse -> add to cart -> checkout login gate", async ({ page }) => {
  await page.goto("/shop?sort=all");
  await expect(page.getByRole("heading", { name: "Shop All" })).toBeVisible();

  const firstAdd = page.getByRole("button", { name: "+ Add" }).first();
  await firstAdd.click();

  await page.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole("heading", { name: /Log in or Sign up to place your order/i })).toBeVisible();
});
