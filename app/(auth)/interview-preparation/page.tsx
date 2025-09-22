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
              Preparing for<br />
              Customer Interviews
            </h1>
          </div>
        </div>
        
        <div className="w-1/2 relative">
          <img
            src="https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/customer_interview_prep.jpg"
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

          
           {/* <p className="text-gray-700 text-lg leading-relaxed max-w-240 m-auto">
             <b>Customer discovery</b> is a term that is thrown around a lot in entrepreneurship circles. What does it really mean? Customer Discovery is all about understanding your potential customers, and figuring out what problems they face. Once you understand a customer's problem, you can start to create a solution that customers will pay for. Interviewing potential customers is the best way to learn what drives them. Let's take a look at a few Customer Discovery Tips.
           </p> */}

        
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
                     HOW DO I FIND PEOPLE TO INTERVIEW?
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
                  <p>Check out Katy Miller's (New England I-Corps) video on how to use LinkedIn for Customer Discovery<br/><br/><iframe width="560" height="315" src="https://www.youtube.com/embed/UewkdYcnTSg?si=ni9qWmWm0qgxWnej" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" data-referrerpolicy="strict-origin-when-cross-origin" data-allowfullscreen></iframe></p>
                  <br/><br/>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Alumni networking events</li>
                    <li>Through people you are already interviewing</li>
                    <li>Existing personal/professional connections</li>
                    <li>Every social media connection you have ever had</li>
                    <li>Whoever runs any business you patronize</li>
                    <li>Professional and trade associations (like IEEE, ACS, others)</li>
                    <li>Standards & regulatory organizations (like ASTM, others)</li>
                    <li>Trade shows & conferences (get the attendee list, if possible)</li>
                    <li>Trade journals, magazine newsletters</li>
                    <li>Equipment suppliers/distributors</li>
                    <li>Co-workers, clients, and vendors</li>
                  </ul>                   
                 </div>
               </div>

        
               <div className="mb-12">
                 <div className="flex items-center gap-4 mb-12">
                   <div className="w-12 h-12 bg-[#6A35FF] rounded-full flex items-center justify-center flex-shrink-0">
                     <span className="text-white font-bold text-lg">2</span>
                   </div>
                   <h2 className="text-4xl font-bold text-gray-900">
                     A TEMPLATE FOR HOW TO CONTACT PEOPLE
                   </h2>
                 </div>

                 <div className="flex gap-8">
                   <div className="w-1/2">
                     <img
                       src="https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/writing_email.jpg"
                       alt="City street view"
                       className="w-full h-100 object-cover rounded-lg"
                     />
                   </div>

                   <div className="w-1/2 flex flex-col justify-center">
                     <div className="space-y-4 text-gray-700 leading-relaxed">
                       <p>
                        Hello, I am [my-name]<br/><br/>
                        • I am a [describe role] at the [name of the University].<br/>
                        • I am part of a program sponsored by the National Science Foundation (US NSF - I-Corps) designed to help researchers gain valuable insight into entrepreneurship and starting a business.<br/>
                        • To enable translation of our research from the academic setting to the marketplace, this program requires us to interview people outside of our research setting. I'm contacting you as someone who has expertise that could be very helpful in our area of focus.<br/>
                        • Our interview would essentially focus on understanding the customer's pains, needs and ecosystem.<br/><br/>

                        • Would you be willing to help? Can we schedule a [describe encounter you would like, such as 15-20 min Zoom/Google Meet/MS Teams]? <br/>
                        • Do you have any preference for time/day of the week for our meeting?<br/>
                        • Thank you for your cooperation and I look forward to hearing from you.<br/>
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
                     ANOTHER TEMPLATE TO CONTACT PEOPLE
                   </h2>
                 </div>

                  <div className="flex gap-8">
                   
                   <div className="w-1/2 flex flex-col justify-center">
                     <div className="space-y-4 text-gray-700 leading-relaxed">
                      <p>
                        Dear [Recipient's Name],<br/><br/>
                        I hope this email finds you well. My name is [Your Name], and I'm part of a team participating in the National Science Foundation's I-Corps program. The goal of our project is to [briefly state the focus of your project, e.g., develop solutions for XYZ challenge].<br/><br/>
                        As part of this program, we are conducting customer discovery interviews to better understand the needs and challenges faced by [specific group/industry, e.g., water and sewer division leaders]. We are not selling or pitching anything but seeking insights that could guide our research and development in a meaningful direction.<br/><br/>
                        Given your expertise in [recipient's field/role], I would greatly appreciate the opportunity to speak with you for about 15 or 20 minutes at your convenience. Your insights would be invaluable in helping us understand [specific aspect you're researching].<br/><br/>
                        If you're available, please let me know a time that works for you. Alternatively, I'm happy to adjust to your schedule.<br/><br/>
                        Thank you very much for considering this request. I truly value your time and expertise.
                        Best regards,<br/>
                        [Your Full Name]<br/>
                        [Your Role/Organization]<br/>
                        [Your Contact Information]<br/>
                      </p>
                       
                     </div>
                   </div>
                   <div className="w-1/2">
                     <img
                       src="https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/writing_email_lab.jpg"
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