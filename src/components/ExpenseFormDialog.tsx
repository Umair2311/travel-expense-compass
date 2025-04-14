import { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Switch, Table, Checkbox, InputNumber, Button, Space, Typography, Radio } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTravel } from '@/context/TravelContext';
import { Expense, ExpenseType } from '@/types/models';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

const ExpenseFormDialog: React.FC<ExpenseFormDialogProps> = ({
  isOpen,
  onOpenChange,
  expense,
}) => {
  const { currentTravel, addExpense, updateExpense, isParticipantPresentOnDate } = useTravel();
  const [form] = Form.useForm();
  
  const [date, setDate] = useState<Date>(expense?.date || new Date());
  const [paidFromFund, setPaidFromFund] = useState(expense?.paidFromFund || false);
  const [expenseType, setExpenseType] = useState<ExpenseType>(expense?.type || 'Meal');
  const [amountError, setAmountError] = useState('');
  
  // For payers
  const [payers, setPayers] = useState<{ participantId: string; amount: number }[]>(
    expense?.paidBy || []
  );
  
  // For expense sharing
  const [participants, setParticipants] = useState<
    { participantId: string; included: boolean; weight: number }[]
  >(expense?.sharedAmong || []);
  
  // Recalculate participants when date changes to auto-include based on presence
  useEffect(() => {
    if (!currentTravel) return;
    
    const newParticipants = currentTravel.participants.map(participant => {
      // Check if participant is already in the list
      const existing = participants.find(p => p.participantId === participant.id);
      
      // Default to included if present on that date, or keep existing state
      const isPresent = isParticipantPresentOnDate(participant.id, date);
      const included = existing ? existing.included : isPresent;
      
      return {
        participantId: participant.id,
        included,
        weight: existing?.weight || 1, // Default weight is 1
      };
    });
    
    setParticipants(newParticipants);
  }, [date, currentTravel, isParticipantPresentOnDate]);
  
  // Initialize payers and participants when expense changes
  useEffect(() => {
    if (expense) {
      form.setFieldsValue({
        amount: expense.amount,
        date: dayjs(expense.date),
        type: expense.type,
        customType: expense.customType || '',
        comment: expense.comment || '',
      });
      
      setDate(expense.date);
      setExpenseType(expense.type);
      setPaidFromFund(expense.paidFromFund);
      setPayers(expense.paidBy);
      setParticipants(expense.sharedAmong);
    } else {
      // Reset form for new expense
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
        type: 'Meal',
      });
      
      setDate(new Date());
      setExpenseType('Meal');
      setPaidFromFund(false);
      
      // Initialize payers with all participants and zero amounts
      if (currentTravel) {
        setPayers(
          currentTravel.participants.map(p => ({
            participantId: p.id,
            amount: 0,
          }))
        );
      }
      
      // Initialize participants with all participants included if present on selected date
      if (currentTravel) {
        setParticipants(
          currentTravel.participants.map(p => ({
            participantId: p.id,
            included: isParticipantPresentOnDate(p.id, date),
            weight: 1,
          }))
        );
      }
    }
  }, [expense, currentTravel, isParticipantPresentOnDate, form]);
  
  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (!currentTravel) return;
      
      const numericAmount = parseFloat(values.amount);
      
      // Filter out payers with zero amount
      const filteredPayers = paidFromFund 
        ? [] 
        : payers.filter(p => p.amount > 0);
      
      // Verify total paid amount equals expense amount
      if (!paidFromFund) {
        const totalPaid = filteredPayers.reduce((sum, p) => sum + p.amount, 0);
        if (Math.abs(totalPaid - numericAmount) > 0.01) {
          setAmountError('Total paid must equal the expense amount');
          return;
        }
      }
      
      if (expense) {
        // Update existing expense
        updateExpense({
          ...expense,
          amount: numericAmount,
          date: values.date.toDate(),
          type: values.type as ExpenseType,
          customType: values.type === 'Custom' ? values.customType : undefined,
          paidBy: filteredPayers,
          paidFromFund,
          sharedAmong: participants,
          comment: values.comment || undefined,
          updated: new Date()
        });
      } else {
        // Add new expense
        addExpense(
          numericAmount,
          values.date.toDate(),
          values.type as ExpenseType,
          values.type === 'Custom' ? values.customType : undefined,
          filteredPayers,
          paidFromFund,
          participants,
          values.comment || undefined
        );
      }
      
      onOpenChange(false);
    });
  };
  
  const updatePayerAmount = (participantId: string, newAmount: number) => {
    setPayers(prev =>
      prev.map(p =>
        p.participantId === participantId ? { ...p, amount: newAmount } : p
      )
    );
    setAmountError('');
  };
  
  const updateParticipantInclusion = (participantId: string, included: boolean) => {
    setParticipants(prev =>
      prev.map(p =>
        p.participantId === participantId ? { ...p, included } : p
      )
    );
  };
  
  const updateParticipantWeight = (participantId: string, weight: number) => {
    setParticipants(prev =>
      prev.map(p =>
        p.participantId === participantId ? { ...p, weight } : p
      )
    );
  };
  
  const getRemainingAmount = (): number => {
    const expenseAmount = form.getFieldValue('amount') || 0;
    const paidAmount = payers.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, expenseAmount - paidAmount);
  };
  
  const distributeRemaining = () => {
    const remaining = getRemainingAmount();
    if (remaining <= 0 || payers.length === 0) return;
    
    // Count active payers (those with existing non-zero amounts or the first if none)
    const activePayers = payers.filter(p => p.amount > 0);
    const numActivePayers = activePayers.length > 0 ? activePayers.length : 1;
    
    // Calculate share per active payer
    const sharePerPayer = remaining / numActivePayers;
    
    setPayers(prev => {
      if (activePayers.length > 0) {
        // Distribute among active payers
        return prev.map(p => {
          if (p.amount > 0) {
            return { ...p, amount: p.amount + sharePerPayer };
          }
          return p;
        });
      } else {
        // If no active payers, assign to first payer
        return prev.map((p, index) => {
          if (index === 0) {
            return { ...p, amount: sharePerPayer };
          }
          return p;
        });
      }
    });
    
    setAmountError('');
  };
  
  const getParticipantName = (participantId: string): string => {
    const participant = currentTravel?.participants.find(p => p.id === participantId);
    return participant?.name || 'Unknown';
  };
  
  const isParticipantPresent = (participantId: string): boolean => {
    return isParticipantPresentOnDate(participantId, date);
  };
  
  const payerColumns = [
    {
      title: 'Participant',
      dataIndex: 'participantId',
      key: 'participantId',
      render: (participantId: string) => (
        <span>
          {getParticipantName(participantId)}
          {!isParticipantPresent(participantId) && (
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
              (not present)
            </Text>
          )}
        </span>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (_: any, record: { participantId: string, amount: number }) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={0.01}
          precision={2}
          value={record.amount}
          onChange={(value) => updatePayerAmount(record.participantId, value || 0)}
        />
      ),
    },
  ];
  
  const participantColumns = [
    {
      title: 'Participant',
      dataIndex: 'participantId',
      key: 'participantId',
      render: (participantId: string) => (
        <span>
          {getParticipantName(participantId)}
          {!isParticipantPresent(participantId) && (
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
              (not present)
            </Text>
          )}
        </span>
      ),
    },
    {
      title: 'Include',
      dataIndex: 'included',
      key: 'included',
      render: (_: any, record: { participantId: string, included: boolean }) => (
        <Checkbox
          checked={record.included}
          onChange={(e) => updateParticipantInclusion(record.participantId, e.target.checked)}
        />
      ),
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (_: any, record: { participantId: string, included: boolean, weight: number }) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0.1}
          step={0.1}
          precision={1}
          value={record.weight}
          onChange={(value) => updateParticipantWeight(record.participantId, value || 1)}
          disabled={!record.included}
        />
      ),
    },
  ];
  
  if (!currentTravel) return null;
  
  return (
    <Modal
      title={expense ? 'Edit Expense' : 'Add Expense'}
      open={isOpen}
      onCancel={() => onOpenChange(false)}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {expense ? 'Save Changes' : 'Add Expense'}
        </Button>,
      ]}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          amount: expense?.amount || '',
          date: expense ? dayjs(expense.date) : dayjs(),
          type: expense?.type || 'Meal',
          customType: expense?.customType || '',
          comment: expense?.comment || '',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
            validateStatus={amountError ? 'error' : ''}
            help={amountError}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="100.00"
              precision={2}
              min={0}
              step={0.01}
              onChange={() => setAmountError('')}
              addonBefore="$"
            />
          </Form.Item>
          
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              onChange={(date) => date && setDate(date.toDate())} 
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select onChange={(value) => setExpenseType(value as ExpenseType)}>
              <Option value="Meal">Meal</Option>
              <Option value="Fuel">Fuel</Option>
              <Option value="Hotel">Hotel</Option>
              <Option value="Custom">Custom</Option>
            </Select>
          </Form.Item>
          
          {expenseType === 'Custom' && (
            <Form.Item
              name="customType"
              label="Custom Type"
              rules={[{ required: true, message: 'Please enter custom type' }]}
            >
              <Input placeholder="e.g., Museum tickets" />
            </Form.Item>
          )}
        </div>
        
        <Form.Item label="Payment Method">
          <Radio.Group
            value={paidFromFund ? 'fund' : 'individual'}
            onChange={(e) => setPaidFromFund(e.target.value === 'fund')}
          >
            <Radio.Button value="fund">Paid from Travel Fund</Radio.Button>
            <Radio.Button value="individual">Paid by Individual(s)</Radio.Button>
          </Radio.Group>
        </Form.Item>
        
        {!paidFromFund && (
          <div className="mt-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Paid By</Text>
              <div>
                <Text type="secondary" style={{ marginRight: '10px' }}>
                  Remaining: ${getRemainingAmount().toFixed(2)}
                </Text>
                <Button
                  size="small"
                  onClick={distributeRemaining}
                  disabled={getRemainingAmount() <= 0}
                >
                  Distribute
                </Button>
              </div>
            </div>
            
            <Table
              dataSource={payers}
              columns={payerColumns}
              pagination={false}
              rowKey="participantId"
              size="small"
              scroll={{ y: 200 }}
            />
          </div>
        )}
        
        <div className="mt-4 mb-4">
          <Text strong className="block mb-2">Shared Among</Text>
          <Table
            dataSource={participants}
            columns={participantColumns}
            pagination={false}
            rowKey="participantId"
            size="small"
            scroll={{ y: 200 }}
          />
        </div>
        
        <Form.Item name="comment" label="Comment (Optional)">
          <TextArea 
            rows={3} 
            placeholder="Add any additional details about this expense" 
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpenseFormDialog;
