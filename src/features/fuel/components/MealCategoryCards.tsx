import React from 'react';
import {
  IntakeCategories,
  IntakeCategoriesProps,
  ExtendedMealCategory,
  CategoryCardData,
} from './IntakeCategories';

export type { ExtendedMealCategory, CategoryCardData };
export type MealCategoryCardsProps = IntakeCategoriesProps;

export const MealCategoryCards: React.FC<IntakeCategoriesProps> = (props) => {
  return <IntakeCategories {...props} />;
};

export default MealCategoryCards;
