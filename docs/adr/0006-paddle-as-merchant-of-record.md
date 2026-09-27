# Paddle as merchant of record

Billing runs through Paddle rather than Stripe because Paddle acts as merchant of record and handles VAT and sales tax for self-serve B2B buyers in many countries. Plan rules (trial, grace periods, respondent allowance) live in our code; Paddle is only the source of subscription state via its webhook.
