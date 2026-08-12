import { registerTranslations, type Language } from '../../contexts/LanguageContext';
import { en } from './en';
import { fr } from './fr';
import { de } from './de';
import { es } from './es';
import { it } from './it';
import { el } from './el';
import { pl } from './pl';
import { lt } from './lt';

const investmentsTranslations: Partial<Record<Language, Record<string, string>>> = {
  en, fr, de, es, it, el, pl, lt,
};

registerTranslations(investmentsTranslations);
