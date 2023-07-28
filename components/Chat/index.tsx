import { createRef, useEffect } from 'react';
import { setSelectedChat } from '@/redux/features/selectedChatSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { updateBotMessage, getMessagesForChat } from '@/redux/features/messagesSlice';
import { TChatProps, TMessage } from '@/types/Chat';
import Message from './subcomponents/Message';
import MessageBox from './subcomponents/MessageBox';
import axios from 'axios';
import { useCompletion } from 'ai/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Chat({ id }: TChatProps) {
	const dispatch = useAppDispatch();

	const { completion, input, handleInputChange, handleSubmit, isLoading } = useCompletion({
		api: `/chats/${id}/completion/api`,
		onFinish: async function(prompt, completion) {
			if(!completion.length) {
				toast.error('Request Failed: Failed to handle the Request', {
					position: 'top-center',
					autoClose: 600,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark'
				});
				return;
			};
			await axios.post(`/chats/${id}/api`, { content: prompt, role: 'user' });
			return axios.post(`/chats/${id}/api`, { content: completion, role: 'assistant' });
		}
	});
	const messagesEndRef : React.RefObject<HTMLDivElement> = createRef();

	dispatch(setSelectedChat(parseInt(id, 10)));

	const messages = useAppSelector(({ messagesReducer }) => messagesReducer.messages);
	const messagesLoading = useAppSelector(({ messagesReducer }) => messagesReducer.loading);

	useEffect(()=>{
		dispatch(getMessagesForChat({ chatId: parseInt(id, 10) }));
		messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	useEffect(()=>{
		if(completion.length > 1) {
			dispatch(updateBotMessage({ role: 'assistant', content: completion }));
			messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
		}
	}, [completion]);

	return <div className='relative'>
		<div className='flex flex-col h-[calc(100dvh)] overflow-clip w-[100vw] lg:w-[100%] pt-20 md:pt-0 lg:pt-0'>
			<div className='overflow-scroll grow justify-center'>
				{!messagesLoading && messages.map((message : TMessage) => {
					return <div key={message.id} className=' lg:max-w-[80vw]'> <Message key={message.id} message={message} /> </div>;
				})}
				{messagesLoading && <div className='mt-10'>
					{Array(6)
						.fill(1)
						.map((_:any, i) => {
							return <Message key={i} skeleton={true}/>;
						})}
				</div>}
				<div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
			</div>

			<div className='mt-2'>
				<MessageBox input={input} handleInputChange={handleInputChange} handleSubmit ={handleSubmit} isLoading={isLoading}/>
			</div>
		</div>
		<ToastContainer />
	</div>;
}