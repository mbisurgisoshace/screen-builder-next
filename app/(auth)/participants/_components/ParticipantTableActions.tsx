import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { CalendarIcon, MoreHorizontal } from "lucide-react";
import { Participant } from "@/lib/generated/prisma";
import {
  markParticipantAsComplete,
  updateParticipant,
} from "@/services/participants";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { participantFormSchema } from "@/schemas/participant";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getSegments } from "@/services/segments";
import { EditorState, convertFromRaw } from "draft-js";
import { MultiSelect } from "@/components/ui/multiselect";

interface ParticipantTableActionsProps {
  participant: Participant;
}

const ROLE_OPTIONS = [
  { value: "Customer", label: "Customer" },
  { value: "End-User", label: "End-User" },
  { value: "Both Customer & End-User", label: "Both Customer & End-User" },
  { value: "Payer", label: "Payer" },
  { value: "Influencer", label: "Influencer" },
  { value: "Recommender", label: "Recommender" },
  { value: "Saboteur", label: "Saboteur" },
  { value: "Additional Decision Maker", label: "Additional Decision Maker" },
  { value: "Additional Stakeholder", label: "Additional Stakeholder" },
];

export default function ParticipantTableActions({
  participant,
}: ParticipantTableActionsProps) {
  const [marketSegments, setMarketSegments] = useState<any[]>([]);

  const getMarketSegments = async () => {
    const segments = await getSegments();

    const marketSegmentOptions = segments
      ?.filter((s: any) => s.draftRaw)
      .map((segment: any) => {
        const draftRaw = segment.draftRaw;
        const raw = JSON.parse(draftRaw);
        const editor = EditorState.createWithContent(convertFromRaw(raw));
        const text = editor.getCurrentContent().getPlainText();

        return text;
      });

    setMarketSegments(marketSegmentOptions);
  };

  useEffect(() => {
    getMarketSegments();
  }, []);

  const form = useForm<z.infer<typeof participantFormSchema>>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: participant.name,
      role: participant.role || "",
      contact_info: participant.contact_info || "",
      rationale: participant.rationale || "",
      market_segment: participant.market_segment || "",
      blocking_issues: participant.blocking_issues || "",
      hypothesis_to_validate: participant.hypothesis_to_validate || "",
      learnings: participant.learnings || "",
      status: participant.status || "need_to_schedule",
      scheduled_date: participant.scheduled_date || undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof participantFormSchema>) {
    await updateParticipant(participant.id, values);
    // form.reset();
  }

  const markAsComplete = async () => {
    await markParticipantAsComplete(participant.id);
  };

  return (
    <Sheet>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <SheetTrigger className="w-full text-left">Edit</SheetTrigger>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={markAsComplete}>
            Mark as Complete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => {}}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SheetContent>
        <SheetHeader className="border-b">
          <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
            Edit Participant
          </SheetTitle>
        </SheetHeader>
        <div className="h-full flex flex-col gap-8 overflow-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 p-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    {/* <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="End-User">End-User</SelectItem>
                        <SelectItem value="Both Customer & End-User">
                          Both Customer & End-User
                        </SelectItem>
                        <SelectItem value="Payer">Payer</SelectItem>
                        <SelectItem value="Influencer">Influencer</SelectItem>
                        <SelectItem value="Recommender">Recommender</SelectItem>
                        <SelectItem value="Saboteur">Saboteur</SelectItem>
                        <SelectItem value="Additional Decision Maker">
                          Additional Decision Maker
                        </SelectItem>
                        <SelectItem value="Additional Stakeholder">
                          Additional Stakeholder
                        </SelectItem>
                      </SelectContent>
                    </Select> */}
                    <FormControl>
                      <MultiSelect
                        options={ROLE_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a role"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                        <SelectItem value="not_available">
                          Not Available
                        </SelectItem>
                        <SelectItem value="need_to_schedule">
                          Need to Schedule
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="market_segment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market Segment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a market segment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* {marketSegments
                          ?.filter(
                            (segment: string) => segment.trim().length > 0
                          )
                          .map((segment: string) => (
                            <SelectItem key={segment} value={segment}>
                              {segment}
                            </SelectItem>
                          ))} */}
                        {marketSegments.map((segment) => {
                          return (
                            <SelectGroup key={segment.title}>
                              <SelectLabel>{segment.title}</SelectLabel>
                              {segment.data
                                .filter(
                                  (s: any) => s.cardTitle?.trim().length > 0
                                )
                                .map((s: any) => (
                                  <SelectItem key={s.id} value={s.cardTitle}>
                                    {s.cardTitle}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Info</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rationale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rationale</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blocking_issues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blocking Issues</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hypothesis_to_validate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hypothesis to Validate</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="learnings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learnings</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex ">
                <Button
                  type="submit"
                  className="bg-[#162A4F] cursor-pointer ml-auto"
                >
                  Update
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
