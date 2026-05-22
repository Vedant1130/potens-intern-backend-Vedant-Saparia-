export const generateMatchReason = (
  product: any,
  profile: {
    age: number;
    monthly_income: number;
    credit_score: number;
    employment_type: string;
    existing_loans: number;
  },
  score: number
): string => {
  const { name, type, min_income, min_credit_score, interest_rate, min_age, max_age } = product;
  const { age, monthly_income, credit_score, employment_type, existing_loans } = profile;

  const incomeFormatted = monthly_income.toLocaleString('en-IN');
  const minIncomeFormatted = Number(min_income).toLocaleString('en-IN');

  switch (type) {
    case 'loan': {
      let sentence = `The ${name} is an exceptional fit for your profile because your credit score of ${credit_score} comfortably exceeds the required ${min_credit_score} baseline, granting you access to an elite interest rate of ${interest_rate}%. `;
      if (existing_loans === 0) {
        sentence += `Having zero active loans indicates excellent debt capacity, while your monthly earnings of ₹${incomeFormatted} easily exceed the ₹${minIncomeFormatted} minimum.`;
      } else {
        sentence += `With ${existing_loans} existing active loan${existing_loans > 1 ? 's' : ''}, your monthly earnings of ₹${incomeFormatted} still provide a highly sustainable margin over the ₹${minIncomeFormatted} minimum requirement.`;
      }
      return sentence;
    }
    case 'credit_card': {
      let sentence = `We matched you with the ${name} as it offers a premium card tier optimized for your ${employment_type} lifestyle. `;
      if (credit_score >= 750) {
        sentence += `Your outstanding credit score of ${credit_score} qualifies you for the lowest revolving rate of ${interest_rate}% and immediate premium limit approvals. `;
      } else {
        sentence += `Your credit score of ${credit_score} meets the required ${min_credit_score} standard. `;
      }
      sentence += `Your monthly income of ₹${incomeFormatted} safely surpasses the ₹${minIncomeFormatted} minimum required to unlock the card's maximum reward tiers.`;
      return sentence;
    }
    case 'savings': {
      let sentence = `The ${name} is a high-yielding, perfect choice to maximize your wealth with an attractive interest rate of ${interest_rate}%. `;
      if (monthly_income >= 30000) {
        sentence += `With monthly receipts of ₹${incomeFormatted}, you can effortlessly maintain any balance safety parameters while enjoying premium online banking privileges. `;
      } else {
        sentence += `It offers an ideal platform to park your monthly income of ₹${incomeFormatted}. `;
      }
      sentence += `Being within the age range of ${min_age} to ${max_age} years, you can count on this account for consistent long-term growth.`;
      return sentence;
    }
    case 'insurance': {
      let sentence = `We highly recommend the ${name} to safeguard your family's future. Your age of ${age} aligns perfectly with the target coverage bracket of ${min_age} to ${max_age} years. `;
      sentence += `Allocating a small portion of your monthly income of ₹${incomeFormatted} (well above the policy eligibility barrier of ₹${minIncomeFormatted}) toward this robust plan is a highly sustainable and crucial step for risk management.`;
      return sentence;
    }
    case 'fixed_deposit': {
      let sentence = `The ${name} fixed deposit offers an exceptional, guaranteed return of ${interest_rate}% to steadily compound your savings. `;
      sentence += `It is a stable harbor for your surplus funds, especially as your income of ₹${incomeFormatted} enables you to lock in capital guarantees. `;
      if (existing_loans > 0) {
        sentence += `Having ${existing_loans} outstanding loan obligations makes securing standard guaranteed growth a very prudent and risk-free asset allocation.`;
      } else {
        sentence += `With zero active loan liabilities, locking in this guaranteed rate is a superb choice to construct your foundational wealth portfolio.`;
      }
      return sentence;
    }
    default:
      return `The ${name} is recommended for your profile. Your credit score of ${credit_score} and monthly earning of ₹${incomeFormatted} fully meet the eligibility criteria.`;
  }
};
