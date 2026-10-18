/**
 * What a food database says about a product's diet suitability.
 * `true` is confirmed, `false` is ruled out, and a missing key means the database does not know.
 */
export interface DietFacts {
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  halal?: boolean;
  kosher?: boolean;
}
