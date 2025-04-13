
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Button, Input, Form, Card, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTravel } from '@/context/TravelContext';
import Layout from '@/components/Layout';
import { DateRange } from '@/types/models';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const NewTravel = () => {
  const navigate = useNavigate();
  const { createTravel } = useTravel();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (values: any) => {
    setIsLoading(true);
    
    const dateRange: DateRange = {
      startDate: values.dateRange[0].toDate(),
      endDate: values.dateRange[1].toDate(),
    };
    
    // Create travel
    createTravel(values.name, dateRange);
    
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
              dateRange: [dayjs(), dayjs().add(7, 'day')]
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
