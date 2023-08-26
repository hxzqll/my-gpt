import Message from './subcomponents/Message';
import MessageBox from './subcomponents/MessageBox';
import axios from 'axios';
import { createRef, useEffect } from 'react';
import { setSelectedChat } from '@/redux/features/selectedChatSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { updateBotMessage, getMessagesForChat } from '@/redux/features/messagesSlice';
import { TChatProps, TMessage } from '@/types/Chat';
import { useCompletion } from 'ai/react';
import { getSession } from '@/redux/features/sessionSlice';
import { toast } from '@/utils/toast';
import { errors } from '@/constants';

export default function Chat({ id }: TChatProps) {
	const dispatch = useAppDispatch();
	const { user, loading: userLoading } = useAppSelector(({ sessionReducer }) => sessionReducer);
	const { completion, input, handleInputChange, handleSubmit, isLoading } = useCompletion({
		api: `/chats/${id}/completion/api`,
		onFinish: async function(prompt, completion) {
			if(!completion.length) {
				toast(errors.OPEN_AI.FAILED_REQUEST, 'error');
				return;
			};
			await axios.post(`/chats/${id}/api`, { content: prompt, role: 'user' });
			return axios.post(`/chats/${id}/api`, { content: completion, role: 'assistant' });
		},
		onError: function() {
			toast(errors.OPEN_AI.FAILED_REQUEST, 'error');
		}
	});
	const messagesEndRef : React.RefObject<HTMLDivElement> = createRef();

	dispatch(setSelectedChat(parseInt(id, 10)));

	const messages = useAppSelector(({ messagesReducer }) => messagesReducer.messages);
	const messagesLoading = useAppSelector(({ messagesReducer }) => messagesReducer.loading);

	useEffect(()=>{
		dispatch(getMessagesForChat({ chatId: parseInt(id, 10) }));
		dispatch(getSession());
		messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	useEffect(()=>{
		if(completion.length > 1) {
			console.log({ completion });
			dispatch(updateBotMessage({ role: 'assistant', content: completion }));
			messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
		}
	}, [completion]);

	useEffect(()=>{
		if(user?.username && userLoading === false) {
			if(!user.openAIKey) {
				toast(errors.NO_KEY, 'error', 4000);
			}
		}
	}, []);

	return <div className='relative'>
		<div className='flex flex-col h-[calc(100dvh)] overflow-clip w-[100vw] lg:w-[100%] pt-20 md:pt-0 lg:pt-0'>
			<div className={`grow justify-center ${messagesLoading?'overflow-clip': 'overflow-scroll'}`}>
				{!messagesLoading && messages.map((message : TMessage) => {
					return <div key={message.id} className=' lg:max-w-[80vw]'> <Message message={message} /> </div>;
				})}
				{messagesLoading && <div className=''>
					{Array(10)
						.fill(1)
						.map((_:any, i) => {
							return <Message key={i} skeleton={true}/>;
						})}
				</div>}
				<div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
			</div>

			<div className='mt-2'>
				<MessageBox input={input} handleInputChange={handleInputChange} allowSubmit={!!user?.openAIKey} handleSubmit={handleSubmit} isLoading={isLoading}/>
			</div>
		</div>
	</div>;
}