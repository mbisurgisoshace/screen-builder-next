export default function InterviewPreparationPage() {
  return (
     <div>
      <div className="flex h-full">
        <div className="flex-1 bg-[#6A35FF] p-8 flex flex-col justify-center">
          <div className="max-w-3xl">
            <div className="flex gap-3 mb-6">
              {/* <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                9.10.25
              </div> */}
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                ≈8 min
              </div>
            </div>
            
            <h1 className="text-6xl font-bold text-white leading-tight mb-8">
              3 Tips to Improve<br />
              Your Customer Discovery
            </h1>
          </div>
        </div>
        
        <div className="w-1/2 relative">
          <img
            src="https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/customer_discovery_illustration_2.jpg"
            alt="illustration of an entrepreneur doing a customer discovery interview of a prospective customer at a cafe. the entrepreneur is seen with a laptop and a notepad. the interviewee is explaining some of the problems they experience."
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="min-h-screen bg-[#eff0f4]">
       <div className="max-w-[960px] mx-auto  bg-[#eff0f4]">
         <div className="pt-8 pb-8">
           <div className="flex gap-3 mb-12  justify-center">
             {/* <div className="bg-white rounded-full px-6 py-2 mr-2 text-gray-700 text-sm font-medium">
               9.10.25
             </div> */}
             {/* <div className="bg-white rounded-full px-6 py-2 mr-2 text-gray-700 text-sm font-medium flex items-center gap-1">
               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
               </svg>
               ≈25 min
             </div> */}
             {/* <div className="bg-white rounded-full px-6 py-2 mr-2 text-gray-700 text-sm font-medium flex items-center gap-2">
               <img 
                 src="/image 9 (3).png" 
                 alt="Peter Green" 
                 className="w-5 h-5 rounded-full object-cover"
               />
               Peter Green - UX/UI designer
             </div> */}
           </div>

         
           {/* <h1 className="text-6xl font-bold text-center text-gray-900 mb-14">
             3 Tips to Improve Your Customer Discovery
           </h1> */}

          
           <p className="text-gray-700 text-lg leading-relaxed max-w-240 m-auto">
             <b>Customer discovery</b> is a term that is thrown around a lot in entrepreneurship circles. What does it really mean? Customer Discovery is all about understanding your potential customers, and figuring out what problems they face. Once you understand a customer's problem, you can start to create a solution that customers will pay for. Interviewing potential customers is the best way to learn what drives them. Let's take a look at a few Customer Discovery Tips.
           </p>

        
           {/* <div className="mb-12">
             <img
               src="/image 13.png"
               alt="City skyscrapers"
               className="w-full h-140 object-cover rounded-lg"
             />
           </div> */}
         </div>

         <div className="p-25 pt-8 pb-8">
           <div className="flex gap-8">
             <div className="flex-1">
               <div className="mb-12">
                 <div className="flex items-center gap-4 mb-12">
                   <div className="w-12 h-12 bg-[#6A35FF] rounded-full flex items-center justify-center flex-shrink-0">
                     <span className="text-white font-bold text-lg">1</span>
                   </div>
                   <h2 className="text-4xl font-bold text-gray-900">
                     Don't be afraid to go off-script
                   </h2>
                 </div>

           
                 {/* <div className="mb-6">
                   <img
                     src="/image 13.png"
                     alt="City skyscrapers"
                     className="w-full h-100 object-cover rounded-lg"
                   />
                 </div> */}


                 <div className="space-y-4 text-gray-700 leading-relaxed">
                   <p>
                     Going out and interviewing people can be extremely daunting. Having a script to follow can alleviate some of the stress. You will want to ask people similar questions to learn more about their day and the problems they face which relate to your business idea.
                   </p>
                   <p>
                     However, some of the greatest insights you will gain are from when the conversation deviates from the script. Don’t be afraid to ask follow-up questions with answers that intrigue you. Digging in and learning about your customer’s emotions is your objective, so don’t be afraid to ask more speci c questions!
                   </p>
                 </div>
               </div>

        
               <div className="mb-12">
                 <div className="flex items-center gap-4 mb-12">
                   <div className="w-12 h-12 bg-[#6A35FF] rounded-full flex items-center justify-center flex-shrink-0">
                     <span className="text-white font-bold text-lg">2</span>
                   </div>
                   <h2 className="text-4xl font-bold text-gray-900">
                     Learn about your customer - don't pitch your business idea
                   </h2>
                 </div>

                 <div className="flex gap-8">
                   <div className="w-1/2">
                     <img
                       src="https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/customer_discovery_illlustration_selling.jpg"
                       alt="City street view"
                       className="w-full h-100 object-cover rounded-lg"
                     />
                   </div>

                   <div className="w-1/2 flex flex-col justify-center">
                     <div className="space-y-4 text-gray-700 leading-relaxed">
                       <p>
                         When talking to your customers, it can be extremely tempting to pitch your business idea. However, it is important to listen and learn from your customer; not the other way around.
                       </p>
                       <p>
                         People will generally be supportive of your idea. This could be misinterpreted as them confirming that they would pay for your product or service.
                       </p>
                       <p>
                         Being supportive of your idea and being willing to pay for it are two very different things.
                       </p>
                       <p>
                         The goal of customer discovery is to learn, not pitch your idea. There will be plenty of opportunities to pitch your ideas. Customer discovery is not it.
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="mb-12">
                 <div className="flex items-center gap-4 mb-12">
                   <div className="w-12 h-12 bg-[#6A35FF] rounded-full flex items-center justify-center flex-shrink-0">
                     <span className="text-white font-bold text-lg">3</span>
                   </div>
                   <h2 className="text-4xl font-bold text-gray-900">
                     Figure out your customer's 5 why
                   </h2>
                 </div>

                  <div className="flex gap-8">
                   
                   <div className="w-1/2 flex flex-col justify-center">
                     <div className="space-y-4 text-gray-700 leading-relaxed">
                       <p>
                        A great article by the University of Akron describes the "5 why's" of customer discovery. This methodology can allow you to get to the bottom of your customer's problem. <br/><br/>First, you need to get your customer talking about the issues they are facing. You can do this by asking an open-ended question like 'What is the most challenging part of this task, process, or job?' Once they begin telling their story, continue to ask "why" questions. For example, 'Can you explain why you do that?' Asking these questions can help you to understand what is really going on with your customer, and might reveal opportunities you didn't know existed.
                      </p>
                      <p>
                        Long-time I-Corps instructor Dr. DasGupta describes the importance of open-ended "Why" questions: "Asking open-ended questions that evoke stories from your customers about their past or current experiences with their products/services is a great way to seek/gather 'evidence' (facts and not opinions) needed to test your value proposition hypotheses."
                      </p>
                      <p>
                        Although repeatedly asking "why" questions can seem tiring, it can be the best way to learn about your customers and test your business hypotheses.
                      </p>
                     </div>
                   </div>
                   <div className="w-1/2">
                     <img
                       src="https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/customer_discovery_illustration_why.jpg"
                       alt="City street view"
                       className="w-full h-100 object-cover rounded-lg"
                     />
                   </div>
                 </div>


                 {/* <div className="flex gap-8 mb-8">
                   <div className="w-1/2">
                     <img
                       src="/image 14.png"
                       alt="Peacock"
                       className="w-full h-100 object-contain rounded-lg"
                     />
                   </div>
                   <div className="w-1/2">
                     <img
                       src="/image 15 (1).png"
                       alt="Kite"
                       className="w-full h-100 object-contain rounded-lg"
                     />
                   </div> 
                 </div> */}
                 
               </div>

                   {/* Tip 4 */}
                 {/* <div className="mb-12">
                   <div className="flex items-center gap-4 mb-12">
                     <div className="w-12 h-12 bg-[#6A35FF] rounded-full flex items-center justify-center flex-shrink-0">
                       <span className="text-white font-bold text-lg">4</span>
                     </div>
                     <h2 className="text-4xl font-bold text-gray-900">
                       Document everything and follow up
                     </h2>
                   </div>

                   <div className="flex gap-8">
                     <div className="flex-1">
                       <div className="mb-8">
                         <img
                           src="/Frame 19969.png"
                           alt="Documentation and follow-up"
                           className="w-full h-100 object-cover rounded-lg"
                         />
                       </div>

                       <div className="space-y-4 text-gray-700 leading-relaxed">
                         <p>
                           Customer discovery interviews are only valuable if you can remember and act on what you learn. Take detailed notes during each conversation, recording not just what people say, but also their tone, body language, and emotional responses.
                         </p>
                         <p>
                           After each interview, take time to reflect on the key insights and patterns you're noticing. Look for common themes across different conversations and identify the most significant pain points or opportunities.
                         </p>
                         <p>
                           Follow up with participants when appropriate. If someone mentioned a specific problem you're working on, reach out with updates or additional questions. This builds relationships and shows you value their input.
                         </p>
                         <p>
                           Create a system to organize and analyze your findings. Whether it's a spreadsheet, database, or visual map, having a structured approach will help you identify trends and make better business decisions based on real customer insights.
                         </p>
                       </div>
                     </div>

                     <div className="w-120 flex flex-col gap-6">                       
                       <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                         <p className="text-[#6A35FF] text-lg font-medium leading-relaxed">
                           Being supportive of your idea and being willing to pay for it are two very different things Being supportive of your idea and being willing to pay for it are two very different things.
                         </p>
                       </div>
                     </div>
                   </div>
                 </div> */}

               {/* <div className="mb-12">
                 <h2 className="text-4xl font-bold text-gray-900 mb-12">
                   Before the customer interviews
                 </h2>
                 
                 <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
                   <p >
                    When talking to your customers, it can be extremely tempting to pitch your business idea. However, it is important to listen and learn from your customer; not the other way around. People will generally be supportive of your idea. This could be misinterpreted as them con rming that they would pay for your product or service. Being supportive of your idea and being willing to pay for it are two very different things. The goal of customer discovery is to learn, not pitch your idea. There will be plenty of opportunities to pitch your ideas. Customer discovery is not it.
                   </p>
             
                 </div>

                 <div className="bg-[#EBE0FF] border-l-20 border-[#6A35FF] text-[#6A35FF] p-6 rounded-lg h-50">
                   <p className="text-lg font-medium  leading-relaxed">
                     Customer discovery is a term that is thrown around a lot in entrepreneurship circles. What does it really mean? Customer Discovery is all about understanding your potential customers, and figuring out what problems they face.
                     Customer discovery is a term that is thrown around a lot in entrepreneurship circles. What does it really mean? Customer Discovery is all about understanding your potential customers, and figuring out what problems they face.
                     Customer discovery is a term that is thrown around a lot in entrepreneurship circles. What does it really mean? Customer Discovery is all about understanding your potential customers, and figuring out what problems they face.
                   </p>
                 </div>

             
               </div> */}
             </div>

           </div>
         </div>
       </div>
     </div>
    </div>
  );
}
