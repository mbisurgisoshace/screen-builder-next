"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Sheet,
  SheetTitle,
  SheetFooter,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns/format";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { EditorState, convertFromRaw } from "draft-js";
import { participantFormSchema } from "@/schemas/participant";
import { createParticipant } from "@/services/participants";

interface AddParticipantProps {
  marketSegments: any[];
}

export default function AddParticipant({
  marketSegments,
}: AddParticipantProps) {
  const marketSegmentOptions = marketSegments
    ?.filter((s: any) => s.draftRaw)
    .map((segment: any) => {
      const draftRaw = segment.draftRaw;
      const raw = JSON.parse(draftRaw);
      const editor = EditorState.createWithContent(convertFromRaw(raw));
      const text = editor.getCurrentContent().getPlainText();

      return text;
    });

  console.log("marketSegments", marketSegments);
  console.log("marketSegmentOptions", marketSegmentOptions);

  const form = useForm<z.infer<typeof participantFormSchema>>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: "",
      role: "",
      contact_info: "",
      rationale: "",
      blocking_issues: "",
      hypothesis_to_validate: "",
      learnings: "",
      market_segment: "",
      scheduled_date: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof participantFormSchema>) {
    console.log("submitting", values);

    //await createParticipant(values);
    form.reset();
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="rounded-full text-sm font-bold">
          + Add Participant
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="border-b">
          <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
            New Participant
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        {marketSegmentOptions
                          ?.filter(
                            (segment: string) => segment.trim().length > 0
                          )
                          .map((segment: string) => {
                            return (
                              <SelectItem key={segment} value={segment}>
                                {segment}
                              </SelectItem>
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
                  Create
                </Button>
              </div>
            </form>
          </Form>
        </div>
        {/* <SheetFooter className="border-t flex items-center flex-row">
          <Button type="submit" className="bg-[#162A4F] cursor-pointer ml-auto">
            Create
          </Button>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
}
