export type TimingValue =
    | 'after_meal'
    | 'before_meal'
    | 'with_food'
    | 'empty_stomach'
    | 'bedtime'
    | 'as_needed'
    | null;

export const TIMING_OPTIONS: { value: TimingValue; en: string; bn: string }[] = [
    { value: 'after_meal',    en: 'After meal',    bn: 'খাবারের পরে'       },
    { value: 'before_meal',   en: 'Before meal',   bn: 'খাবারের আগে'       },
    { value: 'with_food',     en: 'With meal',     bn: 'খাবারের সাথে'      },
    { value: 'empty_stomach', en: 'Empty stomach', bn: 'খালি পেটে'         },
    { value: 'bedtime',       en: 'Bedtime',       bn: 'ঘুমানোর আগে'       },
    { value: 'as_needed',     en: 'As needed',     bn: 'প্রয়োজন অনুযায়ী' },
];

export function timingLabel(t: string | null | undefined): string {
    if (!t) return '';
    const opt = TIMING_OPTIONS.find((o) => o.value === t);
    return opt ? opt.en : t;
}
