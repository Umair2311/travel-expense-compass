
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Form, DatePicker, Space, Typography, List, Tag, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTravel } from '@/context/TravelContext';
import Layout from '@/components/Layout';
import { Participant, ParticipationPeriod } from '@/types/models';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const Participants = () => {
  const { currentTravel, addParticipant, updateParticipant, deleteParticipant, validateParticipationPeriod } = useTravel();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participationPeriods, setParticipationPeriods] = useState<ParticipationPeriod[]>([]);
  
  // Redirect if no current travel
  useEffect(() => {
    if (!currentTravel) {
      navigate('/');
    }
  }, [currentTravel, navigate]);
  
  if (!currentTravel) {
    return null;
  }
  
  const openAddModal = () => {
    form.resetFields();
    setParticipationPeriods([{
      id: Date.now().toString(),
      startDate: currentTravel.startDate,
      endDate: currentTravel.endDate,
    }]);
    setIsAddModalOpen(true);
  };
  
  const handleAddSubmit = (values: any) => {
    // Convert periods from form
    const periods: ParticipationPeriod[] = participationPeriods.map((period, index) => {
      const dateRange = values[`period_${index}`];
      return {
        id: period.id || Date.now().toString() + index,
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      };
    });
    
    // Ensure initialContribution is a number or undefined
    const initialContribution = values.initialContribution 
      ? parseFloat(values.initialContribution) 
      : undefined;
    
    addParticipant(
      values.name, 
      values.email || undefined, 
      periods,
      initialContribution
    );
    
    setIsAddModalOpen(false);
  };
  
  const openEditModal = (participant: Participant) => {
    setEditingParticipant(participant);
    
    // Set the periods
    setParticipationPeriods(
      participant.participationPeriods.map(period => ({
        id: period.id,
        startDate: period.startDate,
        endDate: period.endDate,
      }))
    );
    
    // Set form values
    const formValues: any = {
      name: participant.name,
      email: participant.email || '',
    };
    
    // Set date ranges
    participant.participationPeriods.forEach((period, index) => {
      formValues[`period_${index}`] = [
        dayjs(period.startDate),
        dayjs(period.endDate)
      ];
    });
    
    editForm.setFieldsValue(formValues);
    setIsEditModalOpen(true);
  };
  
  const handleEditSubmit = (values: any) => {
    if (!editingParticipant) return;
    
    // Convert periods from form
    const periods = participationPeriods.map((period, index) => {
      const dateRange = values[`period_${index}`];
      return {
        id: period.id,
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      };
    });
    
    const updatedParticipant: Participant = {
      ...editingParticipant,
      name: values.name,
      email: values.email || undefined,
      participationPeriods: periods,
    };
    
    updateParticipant(updatedParticipant);
    setIsEditModalOpen(false);
  };
  
  const addPeriod = () => {
    setParticipationPeriods([
      ...participationPeriods,
      {
        id: Date.now().toString(),
        startDate: currentTravel.startDate,
        endDate: currentTravel.endDate,
      },
    ]);
  };
  
  const removePeriod = (index: number) => {
    if (participationPeriods.length <= 1) return;
    
    const newPeriods = [...participationPeriods];
    newPeriods.splice(index, 1);
    setParticipationPeriods(newPeriods);
    
    // Also remove from form
    if (isEditModalOpen) {
      const formValues = editForm.getFieldsValue();
      delete formValues[`period_${index}`];
      editForm.setFieldsValue(formValues);
    } else {
      const formValues = form.getFieldsValue();
      delete formValues[`period_${index}`];
      form.setFieldsValue(formValues);
    }
  };

  // Function to validate if date range is within travel period
  const isDateRangeValid = (dates: any) => {
    if (!dates || !dates[0] || !dates[1]) return true;
    
    const startDate = dates[0].toDate();
    const endDate = dates[1].toDate();
    
    return validateParticipationPeriod({
      startDate,
      endDate
    });
  };

  // Disable dates outside of travel period
  const disabledDate = (current: dayjs.Dayjs) => {
    if (!currentTravel) return false;
    
    // Prevent dates before travel start or after travel end
    return current.isBefore(dayjs(currentTravel.startDate), 'day') || 
           current.isAfter(dayjs(currentTravel.endDate), 'day');
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={3}>Participants ({currentTravel.participants.length})</Title>
          <Button
            type="primary" 
            icon={<PlusOutlined />}
            onClick={openAddModal}
          >
            Add Participant
          </Button>
        </div>
        
        {/* Participant List */}
        {currentTravel.participants.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <Text type="secondary" className="block mb-4">No participants added yet</Text>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={openAddModal}
              >
                Add your first participant
              </Button>
            </div>
          </Card>
        ) : (
          <List
            grid={{ 
              gutter: 16, 
              xs: 1, 
              sm: 1, 
              md: 2, 
              lg: 3, 
              xl: 3, 
              xxl: 3 
            }}
            dataSource={currentTravel.participants}
            renderItem={(participant) => (
              <List.Item>
                <Card
                  title={participant.name}
                  extra={
                    <Space>
                      <Button 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => openEditModal(participant)}
                      />
                      <Popconfirm
                        title="Remove participant"
                        description="Are you sure you want to remove this participant?"
                        onConfirm={() => deleteParticipant(participant.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button 
                          icon={<DeleteOutlined />} 
                          size="small"
                        />
                      </Popconfirm>
                    </Space>
                  }
                >
                  {participant.email && (
                    <p className="text-gray-500 mb-3">{participant.email}</p>
                  )}
                  
                  <div className="mb-2">
                    <Text className="flex items-center gap-1 mb-2">
                      <CalendarOutlined /> Participation Periods:
                    </Text>
                    <Space direction="vertical" className="w-full">
                      {participant.participationPeriods.map((period, index) => (
                        <Tag key={index} className="w-full block text-xs px-3 py-1">
                          {dayjs(period.startDate).format("MMM D")} - {dayjs(period.endDate).format("MMM D, YYYY")}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
      
      {/* Add Participant Modal */}
      <Modal
        title="Add Participant"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={600}
        centered // Center vertically on mobile
      >
        <Form 
          form={form}
          layout="vertical"
          onFinish={handleAddSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email (optional)"
          >
            <Input placeholder="john@example.com" type="email" />
          </Form.Item>
          
          <Form.Item
            name="initialContribution"
            label="Initial Contribution (optional)"
          >
            <InputNumber 
              placeholder="0.00" 
              precision={2}
              min={0}
              addonBefore="$"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Participation Periods</Text>
              <Button 
                type="link" 
                onClick={addPeriod}
                icon={<PlusOutlined />}
                size="small"
              >
                Add Period
              </Button>
            </div>
            
            {participationPeriods.map((period, index) => (
              <div key={period.id} className="mb-4 p-3 border rounded relative">
                <Form.Item
                  name={`period_${index}`}
                  label={`Period ${index + 1}`}
                  initialValue={[dayjs(period.startDate), dayjs(period.endDate)]}
                  rules={[
                    { required: true, message: 'Please select a date range' },
                    {
                      validator: (_, value) => {
                        if (value && !isDateRangeValid(value)) {
                          return Promise.reject('Date range must be within travel period');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <RangePicker 
                    className="w-full" 
                    format="YYYY-MM-DD"
                    disabledDate={disabledDate}
                    popupClassName="responsive-datepicker-popup" // Add this to target it with CSS
                  />
                </Form.Item>
                
                {participationPeriods.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removePeriod(index)}
                    className="absolute top-2 right-2"
                    size="small"
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Add Participant
            </Button>
          </div>
        </Form>
      </Modal>
      
      {/* Edit Participant Modal */}
      <Modal
        title="Edit Participant"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={600}
        centered // Center vertically on mobile
      >
        <Form 
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email (optional)"
          >
            <Input placeholder="john@example.com" type="email" />
          </Form.Item>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Participation Periods</Text>
              <Button 
                type="link" 
                onClick={addPeriod}
                icon={<PlusOutlined />}
                size="small"
              >
                Add Period
              </Button>
            </div>
            
            {participationPeriods.map((period, index) => (
              <div key={period.id} className="mb-4 p-3 border rounded relative">
                <Form.Item
                  name={`period_${index}`}
                  label={`Period ${index + 1}`}
                  rules={[
                    { required: true, message: 'Please select a date range' },
                    {
                      validator: (_, value) => {
                        if (value && !isDateRangeValid(value)) {
                          return Promise.reject('Date range must be within travel period');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <RangePicker 
                    className="w-full" 
                    format="YYYY-MM-DD"
                    disabledDate={disabledDate}
                    popupClassName="responsive-datepicker-popup" // Add this to target it with CSS
                  />
                </Form.Item>
                
                {participationPeriods.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removePeriod(index)}
                    className="absolute top-2 right-2"
                    size="small"
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Participants;
