const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pwcinqltvqarwdipcmmd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Y2lucWx0dnFhcndkaXBjbW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDAxNzIsImV4cCI6MjA5ODM3NjE3Mn0.P1EYw1ru2sLO_4YNksEvdvihfhqYipP4P_oDxzrbqSE'

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase