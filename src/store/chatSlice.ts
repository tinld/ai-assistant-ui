import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ChatState, Message } from '../types';

const initialState: ChatState = {
  conversations: [
    {
      id: '1',
      title: 'Báo cáo doanh thu Q3',
      updatedAt: 'Vừa xong',
      snippet: 'Tôi đã đính kèm file báo cáo, bạn hãy tóm tắt giúp tôi.',
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          content: 'Xin chào! Tôi có thể giúp gì cho bạn với hệ thống quản lý hôm nay?',
          timestamp: '14:30',
        },
        {
          id: 'm2',
          role: 'user',
          content: 'Tôi cần bạn phân tích báo cáo doanh thu quý 3. Tôi sẽ tải tệp lên ngay bây giờ.',
          timestamp: '14:31',
        },
        {
          id: 'm3',
          role: 'user',
          content: 'Hãy tóm tắt 3 điểm tăng trưởng chính và rủi ro tiềm ẩn.',
          timestamp: '14:31',
          files: [
            { name: 'Bao_cao_Doanh_thu_Q3.pdf', size: '2.4 MB', type: 'application/pdf' }
          ]
        },
        {
          id: 'm4',
          role: 'assistant',
          content: `Đã nhận tài liệu. Dựa trên Bao_cao_Doanh_thu_Q3.pdf, đây là bản tóm tắt bạn yêu cầu:
          
          <div class="pl-4 border-l-2 border-primary-container space-y-2 mt-4">
          <h4 class="font-semibold text-on-surface">📈 3 Điểm Tăng Trưởng Chính:</h4>
          <ul class="list-disc list-inside space-y-1 text-on-surface-variant font-body-md text-body-md">
          <li>Doanh thu mảng dịch vụ đám mây tăng <strong>24%</strong> so với cùng kỳ năm ngoái.</li>
          <li>Tỷ lệ giữ chân khách hàng doanh nghiệp (B2B) đạt mức kỷ lục <strong>96.5%</strong>.</li>
          <li>Chiến dịch mở rộng thị trường Đông Nam Á bắt đầu đóng góp 12% vào tổng doanh thu mới.</li>
          </ul>
          </div>
          <div class="pl-4 border-l-2 border-error space-y-2 mt-2">
          <h4 class="font-semibold text-on-surface">⚠️ Rủi Ro Tiềm Ẩn:</h4>
          <ul class="list-disc list-inside space-y-1 text-on-surface-variant font-body-md text-body-md">
          <li>Chi phí vận hành máy chủ tăng 15% do giá năng lượng biến động.</li>
          <li>Chu kỳ chốt sale (Sales cycle) của sản phẩm phần cứng đang bị kéo dài thêm trung bình 14 ngày.</li>
          </ul>
          </div>`,
          timestamp: '14:32',
          references: ['Bao_cao_Doanh_thu_Q3.pdf']
        }
      ]
    },
    {
      id: '2',
      title: 'Phân tích đối thủ 2024',
      updatedAt: 'Hôm qua',
      snippet: 'Dựa trên dữ liệu thị trường, đây là 3 điểm nổi bật...',
      messages: []
    },
    {
      id: '3',
      title: 'Kế hoạch Marketing Mùa hè',
      updatedAt: '2 ngày trước',
      snippet: 'Gợi ý cho chiến dịch quảng cáo trên nền tảng mạng xã hội.',
      messages: []
    }
  ],
  activeConversationId: '1',
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const conv = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conv) {
        conv.messages.push(action.payload.message);
      }
    },
    createNewConversation: (state) => {
      const newId = Date.now().toString();
      state.conversations.unshift({
        id: newId,
        title: 'New Conversation',
        updatedAt: 'Just now',
        snippet: 'Start typing to begin...',
        messages: []
      });
      state.activeConversationId = newId;
    }
  },
});

export const { setActiveConversation, addMessage, createNewConversation } = chatSlice.actions;
export default chatSlice.reducer;
