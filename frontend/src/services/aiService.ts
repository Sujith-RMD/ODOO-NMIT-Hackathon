import { SalaryCalculationResult } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const aiService = {
  async parseTimeOffDescription(description: string) {
    if (!GROQ_API_KEY) {
      throw new Error("Missing VITE_GROQ_API_KEY in environment");
    }
    const response = await fetch('/groq/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: `You are an assistant that extracts time-off request details from natural language.
            Respond ONLY with a valid JSON object matching this schema, nothing else:
            {
              "type": "paid" | "sick" | "unpaid",
              "start_date": "YYYY-MM-DD",
              "end_date": "YYYY-MM-DD",
              "reason": "Extracted reason or empty string"
            }
            If the year is not specified, assume the current year.`
          },
          {
            role: 'user',
            content: description
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error("Failed to call Groq API");
    }

    const data = await response.json();
    try {
      const content = JSON.parse(data.choices[0].message.content);
      return content;
    } catch (e) {
      throw new Error("Failed to parse JSON from AI response");
    }
  },

  async explainPayslip(result: SalaryCalculationResult) {
    if (!GROQ_API_KEY) {
      throw new Error("Missing VITE_GROQ_API_KEY in environment");
    }

    const basic = result.components.find(c => c.name === 'Basic Salary')?.monthly_amount || 0;
    const hra = result.components.find(c => c.name === 'House Rent Allowance (HRA)')?.monthly_amount || 0;
    const standard = result.components.find(c => c.name === 'Standard Allowance')?.monthly_amount || 0;
    const bonus = result.components.find(c => c.name === 'Performance Bonus')?.monthly_amount || 0;
    const lta = result.components.find(c => c.name === 'Leave Travel Allowance (LTA)')?.monthly_amount || 0;
    const fixed = result.components.find(c => c.name === 'Fixed Allowance')?.monthly_amount || 0;

    const prompt = `Explain this payslip to the employee in 2-3 short, plain-English sentences.
      Focus on their take-home pay, what's being deducted and why. Be very brief and friendly, avoiding complex finance jargon.

      Basic: ₹${basic}
      HRA: ₹${hra}
      Standard Allowance: ₹${standard}
      Performance Bonus: ₹${bonus}
      LTA: ₹${lta}
      Fixed Allowance: ₹${fixed}
      
      Deductions:
      PF (Employee): ₹${result.pf_employee}
      Professional Tax: ₹${result.professional_tax}
      
      Net Take-home: ₹${result.net_salary}`;

    const response = await fetch('/groq/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are an HR assistant explaining payslips simply to employees.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error("Failed to call Groq API");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
};
