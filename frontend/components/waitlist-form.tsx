"use client";

import * as React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { CircleCheck } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

// waitlist form schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  university: z.string().min(1, "University is required"),
  email: z.string().min(5, "Email is required").email("Invalid email"),
});

const schools = [
  {
    value: "oau",
    label: "Obafemi Awolowo University",
  },
  {
    value: "ui",
    label: "University of Ibadan",
  },
  {
    value: "unilag",
    label: "University of Lagos",
  },
  {
    value: "lasu",
    label: "Lagos State University",
  },
  {
    value: "funaab",
    label: "Federal University of Agriculture, Abeokuta",
  },
  {
    value: "oou",
    label: "Olabisi Onabanjo University",
  },
  {
    value: "eksu",
    label: "Ekiti State University",
  },
  {
    value: "fuoye",
    label: "Federal University Oye-Ekiti",
  },
  {
    value: "osustech",
    label: "Olusegun Agagu University of Science and Technology",
  },
  {
    value: "aaua",
    label: "Adekunle Ajasin University",
  },
  {
    value: "lautech",
    label: "Ladoke Akintola University of Technology",
  },
  {
    value: "uniosun",
    label: "Osun State University",
  },
  {
    value: "futa",
    label: "Federal University of Technology, Akure",
  },
  {
    value: "tasued",
    label: "Tai Solarin University of Education",
  },
  {
    value: "yabatech",
    label: "Yaba College of Technology",
  },
];

export function WaitlistForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: "", email: "", university: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // Handle form submission
    console.log(data);
    // You can send the data to your backend or an API endpoint here
    // delay to show success state
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Reset form after showing success state briefly
    setTimeout(() => {
      form.reset();
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>University</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? schools.find((school) => school.value === field.value)
                            ?.label
                        : "Select university..."}
                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search university..." />
                    <CommandList>
                      <CommandEmpty>No university found.</CommandEmpty>
                      <CommandGroup>
                        {schools.map((school) => (
                          <CommandItem
                            key={school.value}
                            value={school.label}
                            onSelect={() => {
                              form.setValue("university", school.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                school.value === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {school.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                We&apos;ll send you updates about Offloadr.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg">
          <AnimatePresence mode="wait">
            {form.formState.isSubmitting ? (
              <motion.div
                key="submitting"
                className="flex items-center"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Spinner />
              </motion.div>
            ) : form.formState.isSubmitSuccessful ? (
              <motion.div
                key="success"
                className="flex items-center"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CircleCheck className="text-green-500" />
              </motion.div>
            ) : (
              <motion.span
                key="default"
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Join Waitlist
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </form>
    </Form>
  );
}
