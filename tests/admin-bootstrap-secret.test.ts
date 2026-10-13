import assert from "node:assert/strict";
import test from "node:test";
import { isBootstrapSecretConfigured, isBootstrapSecretValid } from "../src/lib/admin-bootstrap-secret.server.ts";

test("aceita apenas segredo configurado com tamanho permitido", () => {
  assert.equal(isBootstrapSecretConfigured("a".repeat(32)), true);
  assert.equal(isBootstrapSecretConfigured("a".repeat(31)), false);
  assert.equal(isBootstrapSecretConfigured("a".repeat(257)), false);
  assert.equal(isBootstrapSecretConfigured(undefined), false);
});

test("valida segredo correto sem comparação textual direta", () => {
  assert.equal(isBootstrapSecretValid("segredo-".repeat(4), "segredo-".repeat(4)), true);
  assert.equal(isBootstrapSecretValid("segredo-".repeat(4), "xegredo-".repeat(4)), false);
});

test("recusa segredo ausente ou entrada fora do limite", () => {
  assert.equal(isBootstrapSecretValid(undefined, "a".repeat(32)), false);
  assert.equal(isBootstrapSecretValid("a".repeat(32), ""), false);
  assert.equal(isBootstrapSecretValid("a".repeat(32), "a".repeat(31)), false);
  assert.equal(isBootstrapSecretValid("a".repeat(32), "a".repeat(257)), false);
});

test("compara conteúdo Unicode corretamente", () => {
  const secret = "á".repeat(32);
  assert.equal(isBootstrapSecretValid(secret, secret), true);
});
