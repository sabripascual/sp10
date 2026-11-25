import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeWhatsapp, prettyWhatsapp, waLink } from "../src/lib/whatsapp";

test("WhatsApp argentino en cualquier formato → 549…", () => {
  for (const x of ["381 555-1234", "+54 9 381 555 1234", "0381 15 555 1234", "54 381 5551234", "5493815551234"])
    assert.equal(normalizeWhatsapp(x), "5493815551234", x);
  assert.equal(normalizeWhatsapp("011 15 1234 5678"), "5491112345678");
  assert.equal(normalizeWhatsapp("3865 15 412345"), "5493865412345");
  assert.equal(normalizeWhatsapp("+34 612 345 678"), "34612345678"); // otro país, tal cual
  assert.equal(normalizeWhatsapp("123"), null);
  assert.equal(prettyWhatsapp("5493815551234"), "+54 9 381 555-1234");
  assert.equal(waLink("5493815551234", "hola crack"), "https://wa.me/5493815551234?text=hola%20crack");
});
