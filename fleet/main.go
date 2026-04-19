// ©AngelaMos | 2026
// main.go

package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"sort"
	"strings"
)

const (
	Reset  = "\033[0m"
	Bold   = "\033[1m"
	Dim    = "\033[2m"
	Red    = "\033[91m"
	Green  = "\033[92m"
	Yellow = "\033[93m"
	Blue   = "\033[94m"
	Purple = "\033[95m"
	Cyan   = "\033[96m"
	White  = "\033[97m"
	Gray   = "\033[90m"
	BgDark = "\033[48;5;236m"
)

type Project struct {
	Name      string
	Aliases   []string
	Dir       string
	Up        string
	Down      string
	Stop      string
	Priority  int
	Tag       string
	Compose   string
	Prefix    string
	GroupOf   []string
}

var projects = []Project{
	{
		Name:     "certgames-prod",
		Aliases:  []string{"cg", "prod"},
		Dir:      "/home/yoshi/dev/CertGames-Core",
		Up:       "docker compose -p certgames-prod -f prod.yml up -d",
		Down:     "docker compose -p certgames-prod -f prod.yml down",
		Stop:     "docker compose -p certgames-prod -f prod.yml stop",
		Priority: 1,
		Tag:      "critical",
		Compose:  "certgames-prod",
		Prefix:   "",
	},
	{
		Name:     "argos-mongo",
		Aliases:  []string{"mongo", "rs"},
		Dir:      "/home/yoshi/dev/operations/angelamos-operations/CertGamesDB-Argos",
		Up:       "just mongo",
		Down:     "just mongo-down",
		Stop:     "just mongo-stop",
		Priority: 2,
		Tag:      "critical",
		Compose:  "certgamesdb-argos",
		Prefix:   "mongodb_primary,mongodb_secondary1,mongodb_secondary2,mongo_express",
	},
	{
		Name:     "argos-mongo-dev",
		Aliases:  []string{"mongo-dev"},
		Dir:      "/home/yoshi/dev/operations/angelamos-operations/CertGamesDB-Argos",
		Up:       "docker compose -f mongo-dev.yml up -d",
		Down:     "docker compose -f mongo-dev.yml down",
		Stop:     "docker compose -f mongo-dev.yml stop",
		Priority: 3,
		Tag:      "database",
		Compose:  "certgamesdb-argos",
		Prefix:   "mongodb_dev",
	},
	{
		Name:     "argos-app",
		Aliases:  []string{"argos", "oneisnun"},
		Dir:      "/home/yoshi/dev/operations/angelamos-operations/CertGamesDB-Argos",
		Up:       "just app",
		Down:     "just app-down",
		Stop:     "just app-stop",
		Priority: 4,
		Tag:      "database",
		Compose:  "certgamesdb-argos",
		Prefix:   "oneisnun_",
	},
	{
		Name:     "certgames-dev",
		Aliases:  []string{"cg-dev"},
		Dir:      "/home/yoshi/dev/CertGames-Core",
		Up:       "docker compose -p certgames-dev --env-file backend/.env.development -f dev.yml up -d",
		Down:     "docker compose -p certgames-dev --env-file backend/.env.development -f dev.yml down",
		Stop:     "docker compose -p certgames-dev --env-file backend/.env.development -f dev.yml stop",
		Priority: 5,
		Tag:      "dev",
		Compose:  "certgames-dev",
		Prefix:   "",
	},
	{
		Name:     "carter-os",
		Aliases:  []string{"carter", "cos"},
		Dir:      "/home/yoshi/dev/operations/angelamos-operations",
		Up:       "just start",
		Down:     "just down",
		Stop:     "just stop",
		Priority: 6,
		Tag:      "dev",
		Compose:  "carter-os-dev",
		Prefix:   "carter-os-",
	},
	{
		Name:     "portfolio",
		Aliases:  []string{"port", "folio"},
		Dir:      "/home/yoshi/dev/CURRENT/portfolio/v1",
		Up:       "just start",
		Down:     "just down",
		Stop:     "just stop",
		Priority: 7,
		Tag:      "prod",
		Compose:  "portfolio",
		Prefix:   "portfolio-",
	},
	{
		Name:     "company",
		Aliases:  []string{"co"},
		Dir:      "/home/yoshi/dev/CURRENT/company-web",
		Up:       "just dev-start",
		Down:     "just dev-down",
		Stop:     "just dev-stop",
		Priority: 8,
		Tag:      "dev",
		Compose:  "company-dev",
		Prefix:   "company-",
	},
	{
		Name:     "vuemantics",
		Aliases:  []string{"vue"},
		Dir:      "/home/yoshi/dev/CURRENT/vuemantics",
		Up:       "just dev-start",
		Down:     "just dev-down",
		Stop:     "just dev-stop",
		Priority: 9,
		Tag:      "dev",
		Compose:  "vuemantics-dev",
		Prefix:   "vuemantics-dev-",
	},
	{
		Name:     "killprocess",
		Aliases:  []string{"kill", "kp"},
		Dir:      "/home/yoshi/dev/CURRENT/kill-process/kill-pr0cess.inc",
		Up:       "docker compose up -d",
		Down:     "docker compose down",
		Stop:     "docker compose stop",
		Priority: 10,
		Tag:      "dev",
		Compose:  "kill-pr0cessinc",
		Prefix:   "killprocess-",
	},
	{
		Name:     "fastapi-react",
		Aliases:  []string{"far", "template"},
		Dir:      "/home/yoshi/dev/templates/stacks/fastapi-react",
		Up:       "just tunnel-start",
		Down:     "just tunnel-down",
		Stop:     "just stop",
		Priority: 11,
		Tag:      "dev",
		Compose:  "fastapi-react-dev",
		Prefix:   "FastAPI-React-Dev-",
	},
	{
		Name:     "axumortem",
		Aliases:  []string{"axu", "binary"},
		Dir:      "/home/yoshi/dev/Cybersecurity-Projects/PROJECTS/intermediate/binary-analysis-tool",
		Up:       "just tunnel-start",
		Down:     "just tunnel-down",
		Stop:     "just stop",
		Priority: 12,
		Tag:      "cyber",
		Compose:  "axumortem",
		Prefix:   "axumortem-",
	},
	{
		Name:     "anil-portfolio",
		Aliases:  []string{"anil"},
		Dir:      "/home/yoshi/dev/mentees/anil/portfolio/portfolio",
		Up:       "just tunnel-start",
		Down:     "just tunnel-down",
		Stop:     "just stop",
		Priority: 13,
		Tag:      "mentee",
		Compose:  "anil-portfolio",
		Prefix:   "anil-portfolio-",
	},
	{
		Name:     "angela-tts",
		Aliases:  []string{"tts"},
		Dir:      "/home/yoshi/dev/operations/angelamos-operations/Angela-TTS",
		Up:       "docker compose -f tts.compose.yml up -d",
		Down:     "docker compose -f tts.compose.yml down",
		Stop:     "docker compose -f tts.compose.yml stop",
		Priority: 14,
		Tag:      "service",
		Compose:  "angela-tts",
		Prefix:   "angela-tts",
	},
	{
		Name:     "vernacopy",
		Aliases:  []string{"verna"},
		Dir:      "/home/yoshi/dev/CURRENT/vernacopy/vernacopy",
		Up:       "docker compose -f compose.yml -f cloudflared.compose.yml up -d",
		Down:     "docker compose down",
		Stop:     "docker compose stop",
		Priority: 15,
		Tag:      "dev",
		Compose:  "vernacopy",
		Prefix:   "vernacopy-",
	},
	{
		Name:     "bug-bounty",
		Aliases:  []string{"bb", "bounty"},
		Dir:      "/home/yoshi/dev/Cybersecurity-Projects/PROJECTS/advanced/bug-bounty-platform",
		Up:       "just start",
		Down:     "just down",
		Stop:     "just stop",
		Priority: 16,
		Tag:      "cyber",
		Compose:  "bug-bounty",
		Prefix:   "bug-bounty-",
	},
	{
		Name:     "siem",
		Aliases:  []string{"siem-dashboard"},
		Dir:      "/home/yoshi/dev/Cybersecurity-Projects/PROJECTS/intermediate/siem-dashboard",
		Up:       "just tunnel-start",
		Down:     "just tunnel-down",
		Stop:     "just stop",
		Priority: 17,
		Tag:      "cyber",
		Compose:  "siem",
		Prefix:   "siem-",
	},
}

var groups = map[string][]string{
	"argos":      {"argos-mongo", "argos-mongo-dev", "argos-app"},
	"certgames":  {"certgames-prod", "certgames-dev"},
	"cyber":      {"axumortem", "bug-bounty", "siem"},
}

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		showStatus()
		return
	}

	switch args[0] {
	case "up":
		if len(args) < 2 {
			fmt.Printf("%s  usage: fleet up <project|group|all>%s\n", Red, Reset)
			os.Exit(1)
		}
		handleUp(args[1])
	case "down":
		if len(args) < 2 {
			fmt.Printf("%s  usage: fleet down <project|group|all>%s\n", Red, Reset)
			os.Exit(1)
		}
		handleDown(args[1])
	case "stop":
		if len(args) < 2 {
			fmt.Printf("%s  usage: fleet stop <project|group|all>%s\n", Red, Reset)
			os.Exit(1)
		}
		handleStop(args[1])
	case "ls", "list":
		showList()
	case "ps", "status":
		showStatus()
	case "help", "-h", "--help":
		showHelp()
	default:
		fmt.Printf("%s  unknown: %s%s\n", Red, args[0], Reset)
		showHelp()
		os.Exit(1)
	}
}

func findProject(name string) *Project {
	lower := strings.ToLower(name)
	for i := range projects {
		if strings.ToLower(projects[i].Name) == lower {
			return &projects[i]
		}
		for _, alias := range projects[i].Aliases {
			if strings.ToLower(alias) == lower {
				return &projects[i]
			}
		}
	}
	return nil
}

func resolveTargets(name string) []Project {
	lower := strings.ToLower(name)

	if lower == "all" {
		sorted := make([]Project, len(projects))
		copy(sorted, projects)
		sort.Slice(sorted, func(i, j int) bool {
			return sorted[i].Priority < sorted[j].Priority
		})
		return sorted
	}

	if members, ok := groups[lower]; ok {
		var result []Project
		for _, m := range members {
			if p := findProject(m); p != nil {
				result = append(result, *p)
			}
		}
		return result
	}

	if p := findProject(name); p != nil {
		return []Project{*p}
	}

	return nil
}

func runProjectCmd(p Project, cmdStr string, action string) bool {
	fmt.Printf("\n  %s%s▸%s %s%s%s %s(%s)%s\n", Bold, Cyan, Reset, Bold, White, p.Name, Gray, action, Reset)
	fmt.Printf("    %s%s%s\n", Dim, p.Dir, Reset)

	cmd := exec.Command("sh", "-c", cmdStr)
	cmd.Dir = p.Dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Run(); err != nil {
		fmt.Printf("    %s✗ failed%s\n", Red, Reset)
		return false
	}
	fmt.Printf("    %s✓ done%s\n", Green, Reset)
	return true
}

func handleUp(target string) {
	targets := resolveTargets(target)
	if targets == nil {
		fmt.Printf("%s  unknown project: %s%s\n", Red, target, Reset)
		fmt.Printf("  run %sfleet ls%s to see available projects\n", Cyan, Reset)
		os.Exit(1)
	}

	printHeader()
	fmt.Printf("  %s%s↑ BRINGING UP%s", Bold, Green, Reset)
	if len(targets) > 1 {
		fmt.Printf(" %s(%d services)%s", Gray, len(targets), Reset)
	}
	fmt.Println()

	ok := 0
	for _, p := range targets {
		if runProjectCmd(p, p.Up, "up") {
			ok++
		}
	}

	fmt.Printf("\n  %s%s%d/%d services started%s\n\n", Bold, statusColor(ok, len(targets)), ok, len(targets), Reset)
}

func hasCritical(targets []Project) bool {
	for _, p := range targets {
		if p.Tag == "critical" {
			return true
		}
	}
	return false
}

func confirmCritical(action string) bool {
	var names []string
	names = append(names, "certgames-prod", "argos-mongo")
	fmt.Printf("\n  %s%s⚠  THIS WILL %s CRITICAL SERVICES: %s%s\n", Bold, Red, strings.ToUpper(action), strings.Join(names, ", "), Reset)
	fmt.Printf("  %stype 'yes' to confirm:%s ", Yellow, Reset)

	scanner := bufio.NewScanner(os.Stdin)
	if scanner.Scan() {
		return strings.TrimSpace(strings.ToLower(scanner.Text())) == "yes"
	}
	return false
}

func handleDown(target string) {
	targets := resolveTargets(target)
	if targets == nil {
		fmt.Printf("%s  unknown project: %s%s\n", Red, target, Reset)
		os.Exit(1)
	}

	if hasCritical(targets) && !confirmCritical("down") {
		fmt.Printf("  %saborted%s\n\n", Dim, Reset)
		return
	}

	printHeader()
	fmt.Printf("  %s%s↓ BRINGING DOWN%s", Bold, Red, Reset)
	if len(targets) > 1 {
		fmt.Printf(" %s(%d services)%s", Gray, len(targets), Reset)
	}
	fmt.Println()

	for i := len(targets) - 1; i >= 0; i-- {
		runProjectCmd(targets[i], targets[i].Down, "down")
	}
	fmt.Println()
}

func handleStop(target string) {
	targets := resolveTargets(target)
	if targets == nil {
		fmt.Printf("%s  unknown project: %s%s\n", Red, target, Reset)
		os.Exit(1)
	}

	if hasCritical(targets) && !confirmCritical("stop") {
		fmt.Printf("  %saborted%s\n\n", Dim, Reset)
		return
	}

	printHeader()
	fmt.Printf("  %s%s⏸ STOPPING%s", Bold, Yellow, Reset)
	if len(targets) > 1 {
		fmt.Printf(" %s(%d services)%s", Gray, len(targets), Reset)
	}
	fmt.Println()

	for i := len(targets) - 1; i >= 0; i-- {
		runProjectCmd(targets[i], targets[i].Stop, "stop")
	}
	fmt.Println()
}

type composeProject struct {
	Name   string `json:"Name"`
	Status string `json:"Status"`
}

func getRunningContainers() map[string]bool {
	cmd := exec.Command("docker", "ps", "--format", "{{.Names}}")
	out, err := cmd.Output()
	if err != nil {
		return nil
	}
	containers := make(map[string]bool)
	for _, name := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if name != "" {
			containers[name] = true
		}
	}
	return containers
}

func getComposeProjects() map[string]string {
	cmd := exec.Command("docker", "compose", "ls", "--format", "json")
	out, err := cmd.Output()
	if err != nil {
		return nil
	}
	var cps []composeProject
	if err := json.Unmarshal(out, &cps); err != nil {
		return nil
	}
	result := make(map[string]string)
	for _, cp := range cps {
		result[cp.Name] = cp.Status
	}
	return result
}

func countContainers(p Project, running map[string]bool) int {
	if p.Prefix == "" {
		return -1
	}

	prefixes := strings.Split(p.Prefix, ",")
	count := 0
	for name := range running {
		for _, pfx := range prefixes {
			if strings.HasPrefix(name, pfx) || name == pfx {
				count++
				break
			}
		}
	}
	return count
}

func showStatus() {
	printHeader()

	composeSt := getComposeProjects()
	running := getRunningContainers()

	fmt.Printf("  %s%-22s %-10s %-14s %s%s\n", Gray, "PROJECT", "STATUS", "CONTAINERS", "TAG", Reset)
	fmt.Printf("  %s%s%s\n", Dim, strings.Repeat("─", 64), Reset)

	sorted := make([]Project, len(projects))
	copy(sorted, projects)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Priority < sorted[j].Priority
	})

	for _, p := range sorted {
		status := ""
		dot := ""
		cCount := countContainers(p, running)

		if _, exists := composeSt[p.Compose]; exists {
			if p.Prefix != "" && cCount == 0 {
				status = "down"
				dot = fmt.Sprintf("%s○%s", Red, Reset)
			} else if cCount > 0 {
				status = fmt.Sprintf("up (%d)", cCount)
				dot = fmt.Sprintf("%s●%s", Green, Reset)
			} else {
				raw := composeSt[p.Compose]
				status = raw
				dot = fmt.Sprintf("%s●%s", Green, Reset)
			}
		} else {
			if cCount > 0 {
				status = fmt.Sprintf("up (%d)", cCount)
				dot = fmt.Sprintf("%s●%s", Green, Reset)
			} else {
				status = "down"
				dot = fmt.Sprintf("%s○%s", Red, Reset)
			}
		}

		tagColor := Gray
		switch p.Tag {
		case "critical":
			tagColor = Red
		case "database":
			tagColor = Yellow
		case "prod":
			tagColor = Green
		case "cyber":
			tagColor = Purple
		case "service":
			tagColor = Blue
		case "mentee":
			tagColor = Cyan
		}

		fmt.Printf("  %s %-22s %-14s %s%s%s\n",
			dot,
			fmt.Sprintf("%s%s%s", White, p.Name, Reset),
			status,
			tagColor, p.Tag, Reset,
		)
	}
	fmt.Println()
}

func showList() {
	printHeader()

	fmt.Printf("  %s%-22s %-28s %s%s\n", Gray, "PROJECT", "ALIASES", "DIRECTORY", Reset)
	fmt.Printf("  %s%s%s\n", Dim, strings.Repeat("─", 90), Reset)

	sorted := make([]Project, len(projects))
	copy(sorted, projects)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Priority < sorted[j].Priority
	})

	for _, p := range sorted {
		aliases := strings.Join(p.Aliases, ", ")
		dir := strings.Replace(p.Dir, "/home/yoshi/dev/", "~/dev/", 1)
		fmt.Printf("  %-22s %s%-28s%s %s%s%s\n",
			fmt.Sprintf("%s%s%s", White, p.Name, Reset),
			Cyan, aliases, Reset,
			Dim, dir, Reset,
		)
	}

	fmt.Printf("\n  %sgroups:%s\n", Gray, Reset)
	for name, members := range groups {
		fmt.Printf("    %s%-14s%s → %s\n", Yellow, name, Reset, strings.Join(members, " → "))
	}
	fmt.Println()
}

func statusColor(ok, total int) string {
	if ok == total {
		return Green
	}
	if ok == 0 {
		return Red
	}
	return Yellow
}

func printHeader() {
	fmt.Println()
	fmt.Printf("  %s%s⚓ FLEET%s %sdocker fleet manager%s\n", Bold, Cyan, Reset, Dim, Reset)
	fmt.Println()
}

func showHelp() {
	printHeader()
	fmt.Printf("  %susage:%s fleet <command> [target]\n\n", Gray, Reset)
	fmt.Printf("  %scommands:%s\n", Gray, Reset)
	fmt.Printf("    %sup%s <name|group|all>   bring up services\n", Green, Reset)
	fmt.Printf("    %sdown%s <name|group|all> tear down services\n", Red, Reset)
	fmt.Printf("    %sstop%s <name|group|all> stop without removing\n", Yellow, Reset)
	fmt.Printf("    %sps%s / %sstatus%s          show live status\n", Cyan, Reset, Cyan, Reset)
	fmt.Printf("    %sls%s / %slist%s            list all projects\n", Cyan, Reset, Cyan, Reset)
	fmt.Printf("    %shelp%s                 this message\n", Gray, Reset)
	fmt.Printf("\n  %sexamples:%s\n", Gray, Reset)
	fmt.Printf("    fleet up cg            %sbring up certgames-prod%s\n", Dim, Reset)
	fmt.Printf("    fleet up argos         %sbring up all argos services%s\n", Dim, Reset)
	fmt.Printf("    fleet down all         %stear down everything%s\n", Dim, Reset)
	fmt.Printf("    fleet ps               %slive status of all projects%s\n", Dim, Reset)
	fmt.Println()
}
