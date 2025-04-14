
export interface Travel {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  currency: string; // Added currency
  description?: string; // Added description
  participants: Participant[];
  expenses: Expense[];
  advanceContributions: AdvanceContribution[];
  created: Date;
  updated: Date;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  participationPeriods: ParticipationPeriod[];
}

export interface ParticipationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
}

export type ExpenseType = 'Meal' | 'Fuel' | 'Hotel' | 'Custom';

export interface Expense {
  id: string;
  amount: number;
  date: Date;
  type: ExpenseType;
  customType?: string;
  paidBy: ExpensePayer[];
  paidFromFund: boolean;
  sharedAmong: ExpenseParticipant[];
  comment?: string;
  created: Date;
  updated: Date;
}

export interface ExpensePayer {
  participantId: string;
  amount: number;
}

export interface ExpenseParticipant {
  participantId: string;
  included: boolean;
  weight: number; // For unequal splits
}

export interface AdvanceContribution {
  id: string;
  participantId: string;
  amount: number;
  date: Date;
  comment?: string;
  created: Date;
}

export interface Settlement {
  participantId: string;
  name: string;
  advancePaid: number;
  personallyPaid: number;
  expenseShare: number;
  dueAmount: number;
  refundAmount: number;
  donated: boolean;
}

export interface DateRange {
  id?: string;
  startDate: Date;
  endDate: Date;
}

export interface TravelContextType {
  travels: Travel[];
  currentTravel: Travel | null;
  setTravels: React.Dispatch<React.SetStateAction<Travel[]>>;
  setCurrentTravel: React.Dispatch<React.SetStateAction<Travel | null>>;
  createTravel: (name: string, startDate: Date, endDate: Date, currency: string, description?: string) => void;
  updateTravel: (id: string, name: string, startDate: Date, endDate: Date, currency: string, description?: string) => void;
  deleteTravel: (id: string) => void;
  addParticipant: (name: string, email?: string, participationPeriods?: ParticipationPeriod[], initialContribution?: number) => void;
  updateParticipant: (participant: Participant) => void;
  deleteParticipant: (id: string) => void;
  addExpense: (
    amount: number,
    date: Date,
    type: ExpenseType,
    customType?: string,
    paidBy: ExpensePayer[],
    paidFromFund: boolean,
    sharedAmong: ExpenseParticipant[],
    comment?: string
  ) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addAdvanceContribution: (participantId: string, amount: number, date: Date, comment?: string) => void;
  updateAdvanceContribution: (id: string, participantId: string, amount: number, date: Date, comment?: string) => void;
  deleteAdvanceContribution: (id: string) => void;
  calculateSettlements: () => Settlement[];
  updateSettlementStatus: (fromId: string, toId: string, status: string) => void;
  exportToExcel: () => void;
  exportToJSON: () => void;
  importFromJSON: (file: File) => Promise<boolean>;
  isParticipantPresentOnDate: (participantId: string, date: Date) => boolean;
  validateParticipationPeriod: (period: { startDate: Date, endDate: Date }) => boolean;
}
