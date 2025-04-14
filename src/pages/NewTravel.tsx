
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Button, Input, Form, Card, Space, Typography, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTravel } from '@/context/TravelContext';
import Layout from '@/components/Layout';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const NewTravel = () => {
  const navigate = useNavigate();
  const { createTravel } = useTravel();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (values: any) => {
    setIsLoading(true);
    
    createTravel(
      values.name,
      values.dateRange[0].toDate(),
      values.dateRange[1].toDate(),
      values.currency || 'USD',
      values.description
    );
    
    setIsLoading(false);
    navigate('/');
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <Card>
          <Title level={4} className="mb-2">Create New Travel</Title>
          <Text type="secondary" className="block mb-6">
            Start by giving your trip a name and selecting the dates
          </Text>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            initialValues={{
              dateRange: [dayjs(), dayjs().add(7, 'day')],
              currency: 'USD'
            }}
          >
            <Form.Item
              name="name"
              label="Travel Name"
              rules={[{ required: true, message: 'Please enter a travel name' }]}
            >
              <Input placeholder="Summer Vacation" />
            </Form.Item>
            
            <Form.Item
              name="dateRange"
              label="Travel Dates"
              rules={[{ required: true, message: 'Please select travel dates' }]}
            >
              <RangePicker 
                className="w-full" 
                format="YYYY-MM-DD"
              />
            </Form.Item>
            
            <Form.Item
              name="currency"
              label="Currency"
              rules={[{ required: true, message: 'Please select a currency' }]}
            >
              <Select placeholder="Select currency">
                <Option value="USD">USD ($)</Option>
                <Option value="EUR">EUR (€)</Option>
                <Option value="GBP">GBP (£)</Option>
                <Option value="JPY">JPY (¥)</Option>
                <Option value="CAD">CAD ($)</Option>
                <Option value="AUD">AUD ($)</Option>
                <Option value="INR">INR (₹)</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description (Optional)"
            >
              <Input.TextArea placeholder="Add a short description of your travel" rows={3} />
            </Form.Item>
            
            <div className="flex justify-between mt-6">
              <Button onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                icon={<PlusOutlined />}
              >
                Create Travel
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default NewTravel;
