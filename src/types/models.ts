export interface Travel {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
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
  addParticipant: (name: string, email?: string, participationPeriods?: DateRange[], initialContribution?: number) => void;
  updateParticipant: (id: string, name: string, email?: string, participationPeriods?: DateRange[]) => void;
  deleteParticipant: (id: string) => void;
  addExpense: (
    description: string,
    amount: number,
    date: Date,
    paidById: string,
    splitMode: "all" | "custom",
    splitIds?: string[],
    category?: string
  ) => void;
  updateExpense: (
    id: string,
    description: string,
    amount: number,
    date: Date,
    paidById: string,
    splitMode: "all" | "custom",
    splitIds?: string[],
    category?: string
  ) => void;
  deleteExpense: (id: string) => void;
  addAdvanceContribution: (participantId: string, amount: number, date: Date, comment?: string) => void;
  updateAdvanceContribution: (id: string, participantId: string, amount: number, date: Date, comment?: string) => void;
  deleteAdvanceContribution: (id: string) => void;
  calculateSettlements: () => Settlement[];
  updateSettlementStatus: (fromId: string, toId: string, status: string) => void;
  exportToExcel: () => void;
  exportToJSON: () => void;
  importFromJSON: (file: File) => Promise<boolean>;
}
