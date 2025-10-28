import axios from 'axios';

interface ClickSendMessage {
  to: string;
  body: string;
  from?: string;
}

interface ClickSendResponse {
  http_code: number;
  response_code: string;
  response_msg: string;
  data: {
    total_price: number;
    total_count: number;
    queued_count: number;
    messages: Array<{
      to: string;
      body: string;
      from: string;
      schedule: number;
      message_id: string;
      message_parts: number;
      message_price: number;
      custom_string: string;
      user_id: number;
      subaccount_id: number;
      country: string;
      carrier: string;
      status: string;
    }>;
  };
}

class ClickSendSMS {
  private username: string;
  private apiKey: string;
  private baseUrl = 'https://rest.clicksend.com/v3';

  constructor() {
    this.username = process.env.CLICKSEND_USERNAME || '';
    this.apiKey = process.env.CLICKSEND_API_KEY || '';

    if (!this.username || !this.apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('ClickSend credentials not found. Running in development mode - SMS will be logged to console.');
      } else {
        throw new Error('ClickSend credentials not found. Please set CLICKSEND_USERNAME and CLICKSEND_API_KEY in your .env file.');
      }
    }
  }

  private getAuthHeader() {
    const credentials = Buffer.from(`${this.username}:${this.apiKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async sendSMS(to: string, message: string, from?: string): Promise<ClickSendResponse> {
    try {
      // Ensure phone number is in international format
      const formattedPhone = this.formatPhoneNumber(to);

      // If no credentials in development, just log and return mock response
      if ((!this.username || !this.apiKey) && process.env.NODE_ENV === 'development') {
        console.log('SMS Mock: Code sent to', formattedPhone.replace(/\d(?=\d{4})/g, '*'));
        
        return {
          http_code: 200,
          response_code: 'SUCCESS',
          response_msg: 'Messages queued for delivery.',
          data: {
            total_price: 0,
            total_count: 1,
            queued_count: 1,
            messages: [{
              to: formattedPhone,
              body: message,
              from: from || process.env.SMS_SENDER_NAME || 'GridMapper',
              schedule: 0,
              message_id: 'dev-mock-' + Date.now(),
              message_parts: 1,
              message_price: 0,
              custom_string: '',
              user_id: 0,
              subaccount_id: 0,
              country: 'NO',
              carrier: 'Mock',
              status: 'SUCCESS'
            }]
          }
        };
      }

      const payload = {
        messages: [
          {
            to: formattedPhone,
            body: message,
            from: from || process.env.SMS_SENDER_NAME || 'GridMapper'
          }
        ]
      };

      const response = await axios.post(
        `${this.baseUrl}/sms/send`,
        payload,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('SMS sending failed:', error.response?.status, error.response?.data?.response_msg || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('SMS authentication failed. Please check your credentials.');
      } else if (error.response?.status === 400) {
        throw new Error(`SMS API error: ${error.response?.data?.response_msg || 'Bad request'}`);
      } else {
        throw new Error(`Failed to send SMS: ${error.response?.data?.response_msg || error.message}`);
      }
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, assume it's a Norwegian number and replace with +47
    if (cleaned.startsWith('0')) {
      cleaned = '47' + cleaned.substring(1);
    }
    
    // If it doesn't start with country code, assume Norwegian (+47)
    if (cleaned.length === 8) {
      cleaned = '47' + cleaned;
    }
    
    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  async getAccountInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('ClickSend Account Error:', error.response?.data || error.message);
      throw new Error('Failed to get account info');
    }
  }
}

// Generate a 6-digit SMS verification code
export function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send password reset SMS
export async function sendPasswordResetSMS(phone: string, code: string): Promise<void> {
  try {
    const sms = new ClickSendSMS();
    
    const message = `Your GridMapper password reset code is: ${code}. This code expires in 10 minutes. If you didn't request this, please ignore this message.`;
    
    await sms.sendSMS(phone, message);
    
  } catch (error) {
    console.error('Error sending password reset SMS:', error);
    throw error;
  }
}

// Send welcome SMS (optional)
export async function sendWelcomeSMS(phone: string, name: string): Promise<void> {
  try {
    const sms = new ClickSendSMS();
    
    const message = `Welcome to GridMapper, ${name}! Your account has been created successfully. Start creating professional grid maps at ${process.env.NEXTAUTH_URL || 'https://gridmapper.com'}`;
    
    await sms.sendSMS(phone, message);
    
  } catch (error) {
    console.error('Error sending welcome SMS:', error);
    throw error;
  }
}

// Test SMS function
export async function testClickSendConnection(): Promise<boolean> {
  try {
    const sms = new ClickSendSMS();
    await sms.getAccountInfo();
    return true;
  } catch (error) {
    console.error('ClickSend connection test failed:', error);
    return false;
  }
}

export default ClickSendSMS;
