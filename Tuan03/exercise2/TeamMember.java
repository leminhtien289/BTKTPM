package exercise2;

// Concrete Observer - thành viên nhóm nhận thông báo task
public class TeamMember implements Observer {
    private final String name;
    private final String role;

    public TeamMember(String name, String role) {
        this.name = name;
        this.role = role;
    }

    @Override
    public void update(String event, String message) {
        System.out.printf("  [%s - %s] %s: %s%n", name, role, event, message);
    }

    @Override
    public String getName() { return name; }
}
